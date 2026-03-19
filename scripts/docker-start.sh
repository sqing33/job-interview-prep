#!/bin/sh
set -eu

BINDING_PATH="/app/node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3/build/Release/better_sqlite3.node"
PACKAGE_DIR="/app/node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3"

if [ ! -f "$BINDING_PATH" ]; then
  echo "better-sqlite3 binding missing, attempting rebuild..."

  if command -v pnpm >/dev/null 2>&1; then
    pnpm rebuild better-sqlite3 || true
  fi

  if [ ! -f "$BINDING_PATH" ]; then
    npm rebuild better-sqlite3 --build-from-source || true
  fi

  if [ ! -f "$BINDING_PATH" ] && [ -d "$PACKAGE_DIR" ]; then
    cd "$PACKAGE_DIR"
    npm run build-release || true
    cd /app
  fi
fi

if [ ! -f "$BINDING_PATH" ]; then
  echo "better-sqlite3 rebuild failed"
  echo "Node: $(node -v)"
  echo "ABI: $(node -p 'process.versions.modules')"
  ls -la "$PACKAGE_DIR" || true
  find "$PACKAGE_DIR" -maxdepth 3 -type f | sort || true
  exit 1
fi

exec node_modules/.bin/next start -p 3857
