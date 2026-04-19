#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

pnpm_cmd() {
    if command -v pnpm >/dev/null 2>&1; then
        pnpm "$@"
        return
    fi
    corepack pnpm "$@"
}

echo "Installing dependencies..."
pnpm_cmd install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only
