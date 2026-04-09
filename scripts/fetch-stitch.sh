#!/usr/bin/env bash
# Usage: fetch-stitch.sh "<url>" "<output-path>"
set -euo pipefail

URL="$1"
OUTPUT="$2"

mkdir -p "$(dirname "$OUTPUT")"

curl -L \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" \
  --compressed \
  --max-redirs 10 \
  -o "$OUTPUT" \
  "$URL"

echo "Downloaded to $OUTPUT ($(wc -c < "$OUTPUT") bytes)"
