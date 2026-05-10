---
name: brain-storage
description: Use when the user wants to create, list, or manage Layerbrain storage — backends, buckets, bucket keys, presigned URLs. Requires the `brain` CLI.
---

# Brain — storage

Layerbrain storage has three levels:

1. **Backend** — the underlying object store (S3-compatible target, region, credentials).
2. **Bucket** — a logical container inside a backend.
3. **Bucket key** — an access credential scoped to a bucket.

Always create the backend first, then the bucket, then keys.

## Preflight

Run `brain whoami`. If it errors, tell the user to run `brain login` (or set `LAYERBRAIN_API_KEY`). See `references/auth.md`.

## Backends

| Intent | Command |
|---|---|
| List backends | `brain storage list-backends --output json` |
| Get backend | `brain storage get-backend <ID> --output json` |
| Create backend | `brain storage create-backend --data-file ./backend.json --output json` |
| Update backend | `brain storage update-backend <ID> --data-file ./backend.json` |
| Validate backend | `brain storage validate-backend <ID>` |
| Delete backend | `brain storage delete-backend <ID>` |

Run `validate-backend` after `create-backend` to confirm credentials work before creating buckets on it.

## Buckets

| Intent | Command |
|---|---|
| List buckets | `brain storage list-buckets --output json` |
| Get bucket | `brain storage get-bucket <ID> --output json` |
| Create bucket | `brain storage create-bucket --data-file ./bucket.json --output json` |
| Update bucket | `brain storage update-bucket <ID> --data-file ./bucket.json` |
| Presigned URL | `brain storage presign-bucket <ID> --data-file ./presign.json --output json` |
| Delete bucket | `brain storage delete-bucket <ID>` |

## Bucket keys

| Intent | Command |
|---|---|
| List keys for a bucket | `brain storage list-bucket-keys <BUCKET_ID> --output json` |
| Create key for a bucket | `brain storage create-bucket-key <BUCKET_ID> --data-file ./key.json --output json` |
| Delete key | `brain storage delete-bucket-key <ID>` |

## Rules

- Always use `--data-file` for storage payloads. They contain credentials and URLs — never inline.
- After `create-backend`, immediately run `validate-backend` and surface the result.
- After `create-bucket-key`, the secret is returned **once**. Capture and hand it to the user; do not log it.
- `delete-backend` cascades — refuse unless the user has confirmed they want all buckets on it gone, or list buckets first.
