#!/usr/bin/env bash
#
# Install an nginx snippet that disables browser caching for .js, .css, .json,
# .geojson, and .html under vtatlasoflife.org. Browsers still use the cache,
# but must revalidate with the server on every request via ETag /
# If-Modified-Since, so changed files are re-downloaded immediately while
# unchanged files return 304 Not Modified (fast, no body).
#
# This script ONLY writes the snippet file. It does not modify any
# sites-available / sites-enabled config — you paste the include line into
# the correct server {} block yourself (instructions printed at the end).
#
# Run on the production server with sudo:
#   sudo bash nginx_nocache_static.sh

set -euo pipefail

SNIPPET_PATH="/etc/nginx/snippets/nocache-static.conf"
INCLUDE_LINE="    include snippets/nocache-static.conf;"

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: must be run as root (use sudo)." >&2
    exit 1
fi

echo "==> Writing snippet to $SNIPPET_PATH"
mkdir -p "$(dirname "$SNIPPET_PATH")"
cat > "$SNIPPET_PATH" <<'EOF'
# Force revalidation on every request for these file types.
# Browser still uses cache, but must check with server (ETag / If-Modified-Since).
# Unchanged files return 304 Not Modified. Changed files re-download.
#
# NOTE: .php is intentionally excluded. A regex location block here would be
# matched before the existing location ~ \.php$ (FPM) block and would break
# PHP handling.
#
# NOTE: Access-Control-Allow-Origin is re-asserted here because nginx
# add_header has non-merging inheritance — any add_header in this block
# discards all inherited add_header directives from the server{} / http{}
# contexts. If the parent config sets CORS, we must repeat it.
location ~* \.(js|css|json|geojson|html)$ {
    add_header Access-Control-Allow-Origin "*" always;
    add_header Cache-Control "no-cache, must-revalidate" always;
    add_header Pragma "no-cache" always;
    expires off;
    etag on;
}
EOF

echo "==> Done writing snippet."
echo ""
echo "----------------------------------------------------------------------"
echo "MANUAL STEP: add this line inside the HTTPS server {} block"
echo "of /etc/nginx/sites-available/vtatlasoflife.org"
echo "(the block with 'listen 443 ...', NOT the port-80 redirect block):"
echo ""
echo "$INCLUDE_LINE"
echo ""
echo "Then validate and reload:"
echo "    sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "Verify response headers from the server:"
echo "    curl -I https://vtatlasoflife.org/VAL_Web_Utilities/js/gbifDataConfig.js"
echo "Expected: Cache-Control: no-cache, must-revalidate"
echo "          ETag: \"...\""
echo ""
echo "Rollback: remove the include line from sites-available/vtatlasoflife.org,"
echo "then 'sudo rm $SNIPPET_PATH' and reload nginx."
echo "----------------------------------------------------------------------"
