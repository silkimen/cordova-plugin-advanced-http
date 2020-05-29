#!/usr/bin/env bash
set -e

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )"; cd ..; pwd )"

if [ $CI == "true" ] && ([ -z $SAUCE_USERNAME ] || [ -z $SAUCE_ACCESS_KEY ]) && ([ -z $BROWSERSTACK_USERNAME ] || [ -z $BROWSERSTACK_ACCESS_KEY ]); then
  echo "Skipping CI tests, because Saucelabs and BrowserStack credentials are not set.";
  exit 0;
fi

printf 'Running e2e tests\n'
pushd $ROOT
./node_modules/.bin/mocha ./test/e2e-tooling/test.js "$@"
popd
