#!/usr/bin/env bash
# better-sqlite3's native bindings don't support Node 26+ yet, so dev/start
# need to run on Node 20.x/22.x/23.x/24.x/25.x. This puts Homebrew's node@22
# ahead on PATH (without touching the system default) before delegating to
# the underlying npm script.
set -e

if command -v brew >/dev/null 2>&1; then
  NODE22_PREFIX="$(brew --prefix node@22 2>/dev/null || true)"
  if [ -n "$NODE22_PREFIX" ] && [ -d "$NODE22_PREFIX/bin" ]; then
    export PATH="$NODE22_PREFIX/bin:$PATH"
  fi
fi

exec npm run "$1:raw"
