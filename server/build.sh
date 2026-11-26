#!/bin/sh
set -eu
mkdir -p dist
cp server.js package.json run.sh dist/
cp -R public dist/public
chmod 755 dist/run.sh
echo "build ok: dist/ (server.js + run.sh + public/)"
