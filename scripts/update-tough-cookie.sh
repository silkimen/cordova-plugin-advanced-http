#!/usr/bin/env bash
set -e

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..

cd $ROOT
npm i
cp node_modules/umd-tough-cookie/lib/umd-tough-cookie.js www/umd-tough-cookie.js
