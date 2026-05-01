#!/usr/bin/env bash
# Sync a tagged release of upstream caveman into vendor/caveman/.
# Never copies hooks/, .claude-plugin/, or install scripts — pi owns activation.

set -euo pipefail

TAG="${1:-main}"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="$REPO_ROOT/vendor/caveman"

echo "Cloning caveman@$TAG to $TMPDIR..."
git clone --depth=1 --branch "$TAG" https://github.com/juliusbrussee/caveman "$TMPDIR/caveman" 2>&1 | tail -3

echo "Refreshing $VENDOR_DIR..."
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"

# Copy only the surfaces we wrap. NEVER copy hooks/ or .claude-plugin/.
for sub in skills agents commands tools LICENSE; do
  if [ -e "$TMPDIR/caveman/$sub" ]; then
    cp -R "$TMPDIR/caveman/$sub" "$VENDOR_DIR/"
  fi
done

echo "Synced upstream tag: $TAG"
ls -la "$VENDOR_DIR"
