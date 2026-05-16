---
name: enabling-https
description: Use when the user wants to enable HTTPS for a Layerbrain machine's public IPv6 address. Requires the official `brain` CLI.
---

# Enable HTTPS on a Layerbrain machine

Use this skill when a user asks for HTTPS, TLS, Let's Encrypt, Certbot, Caddy, or an HTTPS demo on a Layerbrain machine.

## Preflight

Run `command -v brain`; if it exists, use `brain` exactly as found on PATH. Then run `brain whoami`. If either command errors, follow `references/auth.md`. Never use a local `layerbrain/brain` checkout as the CLI.

## Model

Layerbrain direct machine networking exposes the same port outside and inside the machine. There is no external-to-internal port mapping unless Layerbrain later ships a host proxy product.

For direct IPv6 HTTPS:

1. The machine needs public ports `80` and `443`.
2. The app can listen locally, for example `127.0.0.1:3000`.
3. A TLS server inside the machine owns ports `80` and `443`.
4. Let's Encrypt HTTP-01 validation reaches the machine on port `80`.
5. The TLS server presents a certificate whose SAN contains the machine IPv6 address.

## Stateless states

Track the work in these states:

1. `machine_ready`: machine is active, has `public_ipv6`, and was created with `--ports 80,443`.
2. `app_ready`: app responds inside the machine, for example `curl http://127.0.0.1:3000/`.
3. `challenge_ready`: port `80` serves `/.well-known/acme-challenge/*` from a webroot.
4. `cert_issued`: Certbot has issued a Let's Encrypt IP certificate with the `shortlived` profile.
5. `https_ready`: TLS server on `:443` loads the issued cert and forwards to the app.
6. `renewal_ready`: `certbot renew` is scheduled and reloads the TLS server after renewal.
7. `verified`: external `curl https://[<public_ipv6>]/` returns the app.

## Create the machine

Use the official CLI from PATH:

```bash
brain compute list --output json
brain machines create \
  --name https-demo \
  --cpu 1 \
  --ram 1 \
  --disk 10 \
  --region <REGION_ID> \
  --timeout 60 \
  --ports 80,443 \
  --output json
```

Capture `id` and `public_ipv6` from the JSON. Use the returned values exactly.

## Prove an app inside the machine

Example disposable app:

```bash
brain machines exec --timeout 60 <MACHINE_ID> bash -lc '
set -euo pipefail
mkdir -p /opt/layerbrain/https-demo/www
cat > /opt/layerbrain/https-demo/www/index.html <<HTML
Layerbrain HTTPS demo
machine=<MACHINE_ID>
public_ipv6=<PUBLIC_IPV6>
HTML
nohup python3 -m http.server 3000 --bind 127.0.0.1 --directory /opt/layerbrain/https-demo/www >/tmp/layerbrain-https-demo.log 2>&1 &
curl -fsS http://127.0.0.1:3000/
'
```

## Prepare HTTP-01 validation

Certbot webroot mode needs something serving `$ACME_ROOT/.well-known/acme-challenge/*` on port `80`. Caddy is a convenient example for that state:

```bash
brain machines exec --timeout 600 <MACHINE_ID> bash -lc '
set -euo pipefail
PUBLIC_IP="<PUBLIC_IPV6>"
ACME_ROOT=/var/www/layerbrain-acme

if ! command -v caddy >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg ca-certificates
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor > /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

mkdir -p /etc/caddy "$ACME_ROOT"
cat > /etc/caddy/Caddyfile <<CADDY
{
  auto_https off
}

:80 {
  handle /.well-known/acme-challenge/* {
    root * $ACME_ROOT
    file_server
  }

  handle {
    respond "Layerbrain HTTPS challenge endpoint for $PUBLIC_IP" 200
  }
}
CADDY

caddy fmt --overwrite /etc/caddy/Caddyfile >/dev/null 2>&1 || true
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 || caddy start --config /etc/caddy/Caddyfile --adapter caddyfile
'
```

## Issue the IP certificate with Certbot

Use Certbot 5.4 or newer because IP address certificates require `--ip-address`.

```bash
brain machines exec --timeout 600 <MACHINE_ID> bash -lc '
set -euo pipefail
PUBLIC_IP="<PUBLIC_IPV6>"
EMAIL="<EMAIL>"
ACME_ROOT=/var/www/layerbrain-acme

mkdir -p "$ACME_ROOT"
if ! command -v certbot >/dev/null 2>&1 || ! certbot --version 2>&1 | awk '"'"'{split($2,v,"."); exit !((v[1]+0>5)||((v[1]+0)==5&&(v[2]+0)>=4))}'"'"'; then
  python3 -m venv /opt/layerbrain/certbot-venv
  /opt/layerbrain/certbot-venv/bin/python -m pip install --upgrade pip wheel
  /opt/layerbrain/certbot-venv/bin/python -m pip install --upgrade "certbot>=5.4"
  ln -sf /opt/layerbrain/certbot-venv/bin/certbot /usr/local/bin/certbot
fi

certbot certonly \
  --webroot \
  --webroot-path "$ACME_ROOT" \
  --preferred-profile shortlived \
  --ip-address "$PUBLIC_IP" \
  --cert-name "$PUBLIC_IP" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --keep-until-expiring
'
```

Use `--staging` during rehearsals to avoid Let's Encrypt production rate limits. Remove it for the real receipt.

## Enable HTTPS with Caddy

Caddy is only an example. Nginx, HAProxy, Envoy, Apache, or the app's own TLS listener are also valid. This replaces the HTTP-only challenge config with HTTP challenge handling plus HTTPS on `:443`.

```bash
brain machines exec --timeout 600 <MACHINE_ID> bash -lc '
set -euo pipefail
PUBLIC_IP="<PUBLIC_IPV6>"
APP_PORT=3000
ACME_ROOT=/var/www/layerbrain-acme

mkdir -p /etc/caddy "$ACME_ROOT"
cat > /etc/caddy/Caddyfile <<CADDY
{
  auto_https off
}

:80 {
  handle /.well-known/acme-challenge/* {
    root * $ACME_ROOT
    file_server
  }

  handle {
    respond "Layerbrain HTTPS demo: https://[$PUBLIC_IP]/" 200
  }
}

:443 {
  tls /etc/letsencrypt/live/$PUBLIC_IP/fullchain.pem /etc/letsencrypt/live/$PUBLIC_IP/privkey.pem
  reverse_proxy 127.0.0.1:$APP_PORT
}
CADDY

caddy fmt --overwrite /etc/caddy/Caddyfile >/dev/null 2>&1 || true
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 || caddy start --config /etc/caddy/Caddyfile --adapter caddyfile
'
```

## Renewal

Short-lived IP certificates expire in about six days. Renewal must be automatic.

```bash
brain machines exec --timeout 60 <MACHINE_ID> bash -lc '
set -euo pipefail
cat > /usr/local/bin/layerbrain-https-renew <<RENEW
#!/usr/bin/env bash
set -euo pipefail
certbot renew --quiet --deploy-hook "caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 || true"
RENEW
chmod +x /usr/local/bin/layerbrain-https-renew
nohup bash -lc "while true; do /usr/local/bin/layerbrain-https-renew >> /var/log/layerbrain-https-renew.log 2>&1 || true; sleep 21600; done" >/dev/null 2>&1 &
'
```

## Verify

Verify from outside Layerbrain, not only from inside the machine:

```bash
curl -g -fsS https://[<PUBLIC_IPV6>]/
openssl s_client -connect "[<PUBLIC_IPV6>]:443" -verify_ip "<PUBLIC_IPV6>" </dev/null \
  | openssl x509 -noout -issuer -dates -ext subjectAltName
```

Successful verification shows the app response and a certificate with `IP Address:<PUBLIC_IPV6>` in the Subject Alternative Name.

## Rules

- Use the official `brain` binary from PATH only.
- Do not modify Layerbrain source repos to make a demo unless the user explicitly asks for code changes.
- Keep the machine-side flow stateless: rerunning a state should either succeed or replace the same files.
- Prefer `--timeout 60` for demo machines unless the user asks to keep them running.
- If `brain machines exec` is interrupted locally, inspect the machine before retrying; the remote command may have completed.
- Delete demo machines when the user no longer needs the live URL.
