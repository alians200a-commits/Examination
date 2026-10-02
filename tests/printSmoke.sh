#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || true)"
if [ -z "$CHROME" ]; then echo 'Chromium unavailable: print smoke test failed'; exit 1; fi
if ! command -v pdfinfo >/dev/null; then echo 'pdfinfo unavailable: print smoke test failed'; exit 1; fi
npm run dev -- --host 127.0.0.1 > /tmp/examination-vite.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT
for n in $(seq 1 30); do if curl --silent --fail http://127.0.0.1:5173/ >/dev/null; then break; fi; sleep 1; done
if ! curl --silent --fail http://127.0.0.1:5173/ >/dev/null; then echo "Vite did not start"; cat /tmp/examination-vite.log; exit 1; fi
for pages in 1 2; do
  file="/tmp/examination-${pages}-pages.pdf"
  "$CHROME" --headless --no-sandbox --disable-dev-shm-usage --disable-gpu \
    --no-pdf-header-footer --virtual-time-budget=12000 \
    --user-data-dir="/tmp/examination-chrome-$pages" \
    --print-to-pdf="$file" "http://127.0.0.1:5173/?smokePages=$pages&smokePreview=1" \
    >/tmp/examination-chrome-$pages.log 2>&1 || { echo "Chrome failed to generate PDF ($pages pages)"; cat /tmp/examination-chrome-$pages.log; cat /tmp/examination-vite.log; exit 1; }
  if [ ! -s "$file" ]; then echo "Chrome produced no PDF ($pages pages)"; cat /tmp/examination-chrome-$pages.log; cat /tmp/examination-vite.log; exit 1; fi
  actual="$(pdfinfo "$file" | awk '/^Pages:/{print $2}')"
  echo "A4 preview pages: $pages; exported PDF pages: $actual"
  if [ "$actual" != "$pages" ]; then cat /tmp/examination-chrome-$pages.log; exit 1; fi
done
echo 'A4 screen/print page parity passed.'
