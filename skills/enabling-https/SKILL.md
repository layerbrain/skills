---
name: enabling-https
description: Use when the user wants browser-valid HTTPS/TLS for a Layerbrain machine's public IPv6 address using Let's Encrypt IP certificates. Requires the official `brain` CLI.
---

# Enable HTTPS on a Layerbrain machine

Use this skill when a user asks for HTTPS, TLS, SSL, Let's Encrypt, Certbot, Caddy, Nginx, reverse proxy, or an HTTPS demo on a Layerbrain machine.

## Canonical path

For a Layerbrain machine reached as `https://[<public_ipv6>]`, do this exact flow:

1. Create the machine with public ports `80,443`. Public ports are create-time firewall rules; if the machine was not created with both ports, create a replacement.
2. Run the app on localhost inside the machine, for example `127.0.0.1:3000`.
3. Serve HTTP-01 challenge files on public port `80`.
4. Use Certbot 5.4 or newer to request a Let's Encrypt IP certificate with `--ip-address <public_ipv6>` and `--preferred-profile shortlived`.
5. Configure a TLS server on public port `443` to load the issued `fullchain.pem` and `privkey.pem`, then reverse proxy to the local app.
6. Schedule renewal because Let's Encrypt IP certificates are short-lived, currently about six days.
7. Verify externally with `curl -g https://[<public_ipv6>]/` and `openssl s_client -verify_ip <public_ipv6>`.

Do not use a domain certificate for `https://[<ipv6>]`; browsers require a certificate SAN containing `IP Address:<public_ipv6>`.

Do not use DNS-01 for IP certificates. Let's Encrypt IP address certificates use HTTP-01 or TLS-ALPN-01 validation and require the `shortlived` profile.

Caddy is only the example HTTP challenge server and TLS reverse proxy below. Nginx, HAProxy, Envoy, Apache, or the app's own TLS listener are also valid if they serve `/.well-known/acme-challenge/*` on `:80`, present the IP SAN certificate as the default cert on `:443`, and reload after renewal.

## Preflight

Run `command -v brain`; if it exists, use `brain` exactly as found on PATH. Then run `brain whoami`. If either command errors, follow `references/auth.md`. Never use a local `layerbrain/brain` checkout as the CLI.

## Model

Layerbrain direct machine networking exposes the same port outside and inside the machine. There is no external-to-internal port mapping unless Layerbrain later ships a host proxy product.

For direct IPv6 HTTPS:

1. The machine needs public ports `80` and `443`.
2. The app can listen locally, for example `127.0.0.1:3000`.
3. A TLS server inside the machine owns ports `80` and `443`.
4. Let's Encrypt HTTP-01 validation reaches the machine on port `80`.
5. The TLS server presents a certificate whose SAN contains `IP Address:<public_ipv6>`.

## Stateless states

Track the work in these states:

1. `machine_ready`: machine is active, has `public_ipv6`, and was created with `--ports 80,443`.
2. `app_ready`: app responds inside the machine, for example `curl http://127.0.0.1:3000/`.
3. `challenge_ready`: port `80` serves `/.well-known/acme-challenge/*` from a webroot.
4. `cert_issued`: Certbot has issued a Let's Encrypt IP certificate with `--ip-address <public_ipv6>` and the `shortlived` profile.
5. `https_ready`: TLS server on `:443` loads the issued cert as the default certificate and forwards to the app.
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

Certbot webroot mode needs something serving `$ACME_ROOT/.well-known/acme-challenge/*` on public port `80`. Caddy is a convenient example for that state. Keep Caddy automatic HTTPS disabled here; Certbot issues the IP certificate, and Caddy only serves challenge files and later loads the issued certificate.

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

Use Certbot 5.4 or newer because IP address certificates require `--ip-address`. The important parts are:

- `--ip-address "$PUBLIC_IP"` puts the machine IPv6 literal into the certificate SAN as an IP address.
- `--preferred-profile shortlived` requests the Let's Encrypt profile required for IP certificates while still allowing future-compatible fallback if the profile changes.
- `--webroot --webroot-path "$ACME_ROOT"` proves control through HTTP-01 on port `80`.
- `--cert-name "$PUBLIC_IP"` gives the cert a stable, predictable path under `/etc/letsencrypt/live/$PUBLIC_IP/`.

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

Use `--staging` during rehearsals to avoid Let's Encrypt production rate limits. Remove it for the real certificate.

## Enable HTTPS with Caddy

Caddy is only an example. Nginx, HAProxy, Envoy, Apache, or the app's own TLS listener are also valid. This replaces the HTTP-only challenge config with HTTP challenge handling plus HTTPS on `:443`.

Important requirements for any TLS server:

- Listen on `:443` inside the machine; Layerbrain does not map external port `443` to a different internal port.
- Present `/etc/letsencrypt/live/$PUBLIC_IP/fullchain.pem` and `/etc/letsencrypt/live/$PUBLIC_IP/privkey.pem` as the default certificate because many clients omit SNI for IP-literal URLs.
- Keep `:80` serving the ACME webroot for renewals, then redirect or respond for all other paths.
- Proxy to the app on localhost, not on a public app port.

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
    redir https://[$PUBLIC_IP]{uri} permanent
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

Short-lived IP certificates expire in about six days. Renewal must be automatic and must reload the TLS server after Certbot writes a renewed certificate.

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
- If the machine was created without both ports `80` and `443`, create a replacement; public port rules are immutable.
- Do not expose the app's development port publicly for HTTPS demos. Open only `80,443` and proxy from the TLS server to localhost.
- Treat Certbot as the certificate issuer for IP literals. Use Caddy, Nginx, HAProxy, Envoy, Apache, or app TLS only to serve ACME HTTP-01 and present the issued cert.
- If `brain machines exec` is interrupted locally, inspect the machine before retrying; the remote command may have completed.
- Delete demo machines when the user no longer needs the live URL.
