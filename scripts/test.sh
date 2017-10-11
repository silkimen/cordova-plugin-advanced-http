#!/usr/bin/env bash
set -e

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..

pushd $ROOT
./node_modules/.bin/mocha ./test/mocha-specs/test.js "$@"
popd
