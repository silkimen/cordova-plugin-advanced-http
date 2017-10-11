#!/usr/bin/env bash
set -e

VERSION=$(node -e "console.log(require('./package.json').version)")

./scripts/update-tough-cookie.sh
node ./scripts/update-plugin-xml.js $VERSION
git commit -a -m "release v$VERSION"
git tag "v$VERSION"
npm publish
