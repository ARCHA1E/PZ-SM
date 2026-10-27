#!/usr/bin/env bash
# Run a command inside a Node 22 dev container with the repo mounted at /work.
# Usage: ./scripts/dev.sh pnpm test
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MSYS_NO_PATHCONV=1 docker run --rm -i \
  -v "$ROOT:/work" -v pzsm-pnpm-store:/pnpm-store -w /work \
  -e PNPM_HOME=/pnpm -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 -e CI=1 \
  ${DEV_PORTS:-} node:22-bookworm bash -lc "corepack enable >/dev/null 2>&1; pnpm config set store-dir /pnpm-store >/dev/null; $*"
