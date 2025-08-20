#!/usr/bin/env bash
set -euo pipefail

# Run backend pytest using the currently active Python (works with conda). No venv is created.
# Usage: ./scripts/test-backend-conda.sh

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

PY=python
if command -v python3 >/dev/null 2>&1; then
  PY=python3
fi

echo "Python executable: $($PY -c 'import sys; print(sys.executable)')"
$PY -V || true

REQ_FILE="$ROOT_DIR/backend/requirements.txt"
if [[ ! -f "$REQ_FILE" ]]; then
  echo "requirements.txt not found at $REQ_FILE" >&2
  exit 1
fi

echo "Installing backend dependencies into the current environment (no venv)..."
$PY -m pip install --upgrade pip
$PY -m pip install -r "$REQ_FILE" pytest

echo "Running pytest..."
cd "$ROOT_DIR/backend"
set +e
$PY -m pytest -q
STATUS=$?
set -e

if [[ $STATUS -ne 0 ]]; then
  echo "Pytest failed with exit code $STATUS" >&2
  exit $STATUS
fi

echo "Backend tests passed."
