---
name: storage
description: Use when the user wants to create, list, or manage Layerbrain buckets, objects, folders, and presigned URLs. Requires the `brain` CLI.
---

# Layerbrain storage

Layerbrain storage is bucket-based object storage. Use buckets for durable outputs from machines, builds, agents, and data pipelines.

## Preflight

Run `command -v brain`; if it exists, use `brain` exactly as found on PATH. Then run `brain whoami`. If either command errors, follow `references/auth.md`. Never use a local `layerbrain/brain` checkout as the CLI.

## Buckets

| Intent | Command |
|---|---|
| List buckets | `brain buckets list --output json` |
| Get bucket | `brain buckets get <ID> --output json` |
| Create bucket | `brain buckets create --name <name> --output json` |
| Update bucket status | `brain buckets update <ID> --status active` |
| Delete bucket | `brain buckets delete <ID>` |

## Objects

| Intent | Command |
|---|---|
| List objects | `brain buckets list-objects <BUCKET_ID> --output json` |
| Search objects | `brain buckets search --output json` |
| Head object | `brain buckets head-object <BUCKET_ID> --key <key> --output json` |
| Create folder | `brain buckets create-folder <BUCKET_ID> --name <name>` |
| Copy object or prefix | `brain buckets copy-object <BUCKET_ID> --from-key <src> --to-key <dst>` |
| Move object or prefix | `brain buckets move-object <BUCKET_ID> --from-key <src> --to-key <dst>` |
| Delete object or prefix | `brain buckets delete-object <BUCKET_ID> --key <key>` |

Add `--recursive` for prefix copy, move, or delete when needed.

## Presigned URLs

| Intent | Command |
|---|---|
| Generate upload URL | `brain buckets presign <BUCKET_ID> --operation upload --key <key> --output json` |
| Generate download URL | `brain buckets presign <BUCKET_ID> --operation download --key <key> --output json` |
| Add expiration | Add `--expires-in <seconds>` |
| Add upload content type | Add `--content-type <mime>` |

## Rules

- Prefer presigned URLs for uploads and downloads from external systems.
- Do not invent storage access-key prefixes or fake secrets. If credentials are returned by a command, treat them as opaque and show placeholders in docs or examples.
- Capture bucket IDs from JSON output; object commands use bucket IDs, not bucket names.
- Delete is destructive. Confirm before deleting a bucket or recursive object prefix.
