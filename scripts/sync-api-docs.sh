#!/usr/bin/env bash
# Copies the API documentation from a base-shop clone into docs/api/ and records where it came from
# (ADR-F002). The copies are never edited by hand: run this again to update them.
#
# Usage: bash scripts/sync-api-docs.sh <path to a base-shop clone>
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo 'Usage: bash scripts/sync-api-docs.sh <path to a base-shop clone>' >&2
  exit 2
fi

readonly SOURCE="$1"
readonly TARGET="$(cd "$(dirname "$0")/.." && pwd)/docs/api"
readonly FILES=(API_SPEC BUSINESS_RULES REQUIREMENTS DOMAIN_MODEL DECISIONS SECURITY PROJECT CHANGELOG)

if [[ ! -f "$SOURCE/docs/API_SPEC.md" || ! -f "$SOURCE/package.json" ]]; then
  echo "Not a base-shop clone: $SOURCE" >&2
  exit 1
fi
if [[ -n "$(git -C "$SOURCE" status --porcelain -- docs)" ]]; then
  echo "The docs of $SOURCE have uncommitted changes; copy only committed documentation." >&2
  exit 1
fi

commit="$(git -C "$SOURCE" rev-parse HEAD)"
branch="$(git -C "$SOURCE" rev-parse --abbrev-ref HEAD)"
commit_date="$(git -C "$SOURCE" log -1 --format=%cs)"
version="$(node -p "require(process.argv[1]).version" "$SOURCE/package.json")"
today="$(date +%F)"

if [[ "$branch" != main ]]; then
  echo "Warning: $SOURCE is on $branch, not main." >&2
fi

for name in "${FILES[@]}"; do
  cp "$SOURCE/docs/$name.md" "$TARGET/$name.md"
done
mkdir -p "$TARGET/openapi"
cp "$SOURCE/docs/openapi/v1.json" "$TARGET/openapi/v1.json"

# The origin table of docs/api/README.md: one "| Field | value |" row per field.
sed -i.bak \
  -e "s/^| Rama | .* |$/| Rama | \`$branch\` |/" \
  -e "s/^| Commit | .* |$/| Commit | \`$commit\` |/" \
  -e "s/^| Fecha del commit | .* |$/| Fecha del commit | $commit_date |/" \
  -e "s/^| Versión de la API | .* |$/| Versión de la API | $version |/" \
  -e "s/^| Copiado el | .* |$/| Copiado el | $today |/" \
  "$TARGET/README.md"
rm "$TARGET/README.md.bak"

echo "Copied base-shop $version ($commit) into docs/api/."
git -C "$TARGET" diff --stat -- .
