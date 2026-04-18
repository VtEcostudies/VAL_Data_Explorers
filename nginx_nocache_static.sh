#!/usr/bin/env bash
#
# Install an nginx snippet that disables browser caching for .js, .css, .json,
# .geojson, and .html under vtatlasoflife.org. Browsers will still use the
# cache, but must revalidate with the server on every request via ETag /
# If-Modified-Since, so changed files are re-downloaded immediately while
# unchanged files return 304 Not Modified (fast, no body).
#
# Run on the production server with sudo:
#   sudo bash nginx_nocache_static.sh
#
# Idempotent: re-running won't duplicate the include line.

set -euo pipefail

SNIPPET_PATH="/etc/nginx/snippets/nocache-static.conf"
SITE_CONFIG="${1:-/etc/nginx/sites-enabled/vtatlasoflife.org}"
INCLUDE_LINE="    include snippets/nocache-static.conf;"
BACKUP_SUFFIX=".bak.$(date +%Y%m%d%H%M%S)"

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: must be run as root (use sudo)." >&2
    exit 1
fi

if [[ ! -f "$SITE_CONFIG" ]]; then
    echo "ERROR: site config not found at $SITE_CONFIG" >&2
    echo "Pass the correct path as arg 1, e.g.:" >&2
    echo "    sudo bash $0 /etc/nginx/sites-enabled/your-site.conf" >&2
    exit 1
fi

echo "==> Writing snippet to $SNIPPET_PATH"
mkdir -p "$(dirname "$SNIPPET_PATH")"
cat > "$SNIPPET_PATH" <<'EOF'
# Force revalidation on every request for these file types.
# Browser still uses cache, but must check with server (ETag / If-Modified-Since).
# Unchanged files return 304 Not Modified. Changed files re-download.
location ~* \.(js|css|json|geojson|html|php)$ {
    add_header Cache-Control "no-cache, must-revalidate" always;
    add_header Pragma "no-cache" always;
    expires off;
    etag on;
}
EOF

echo "==> Backing up $SITE_CONFIG to ${SITE_CONFIG}${BACKUP_SUFFIX}"
cp -p "$SITE_CONFIG" "${SITE_CONFIG}${BACKUP_SUFFIX}"

if grep -qF "nocache-static.conf" "$SITE_CONFIG"; then
    echo "==> Include already present in $SITE_CONFIG; skipping edit."
else
    echo "==> Injecting include into first server {} block of $SITE_CONFIG"
    # Insert include after the first line that contains only 'server {' (with optional whitespace).
    awk -v line="$INCLUDE_LINE" '
        !added && /^[[:space:]]*server[[:space:]]*\{[[:space:]]*$/ {
            print; print line; added=1; next
        }
        { print }
    ' "$SITE_CONFIG" > "${SITE_CONFIG}.new"
    mv "${SITE_CONFIG}.new" "$SITE_CONFIG"
fi

echo "==> Testing nginx config"
if ! nginx -t; then
    echo "ERROR: nginx -t failed. Restoring backup." >&2
    mv "${SITE_CONFIG}${BACKUP_SUFFIX}" "$SITE_CONFIG"
    exit 1
fi

echo "==> Reloading nginx"
systemctl reload nginx || nginx -s reload

echo "==> Done."
echo ""
echo "Verify headers from the server:"
echo "    curl -I https://vtatlasoflife.org/VAL_Species_Page/js/valSpeciesPage.js"
echo ""
echo "Expected: Cache-Control: no-cache, must-revalidate"
echo "         ETag: \"...\""
echo ""
echo "Rollback: restore the backup and reload:"
echo "    sudo mv ${SITE_CONFIG}${BACKUP_SUFFIX} $SITE_CONFIG"
echo "    sudo nginx -t && sudo systemctl reload nginx"
