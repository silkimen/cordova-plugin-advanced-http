#!/usr/bin/env bash
set -e

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
TEMP=$ROOT/temp

rm -rf $TEMP/HttpDemo.app.zip
pushd $TEMP/platforms/ios/build/emulator
zip -r $TEMP/HttpDemo.app.zip ./HttpDemo.app
popd

curl -u $SAUCE_USERNAME:$SAUCE_ACCESS_KEY \
    -X POST \
    -H "Content-Type: application/octet-stream" \
    https://saucelabs.com/rest/v1/storage/$SAUCE_USERNAME/HttpDemo.app.zip?overwrite=true \
    --data-binary @$TEMP/HttpDemo.app.zip
