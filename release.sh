#!/usr/bin/env bash
set -e

VERSION=$(node -e "console.log(require('./package.json').version)")

./scripts/update-tough-cookie.sh
npm publish
git tag "v$VERSION"
