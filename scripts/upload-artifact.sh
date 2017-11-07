#!/usr/bin/env bash
set -e

PLATFORM=$([[ "${@#--android}" = "$@" ]] && echo "ios" || echo "android")
ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
TEMP=$ROOT/temp

if [ $PLATFORM = "android" ]; then
  curl -u $SAUCE_USERNAME:$SAUCE_ACCESS_KEY \
      -X POST \
      -H "Content-Type: application/octet-stream" \
      https://saucelabs.com/rest/v1/storage/$SAUCE_USERNAME/HttpDemo.apk?overwrite=true \
      --data-binary @$TEMP/platforms/android/build/outputs/apk/android-debug.apk
else
  rm -rf $TEMP/HttpDemo.app.zip
  pushd $TEMP/platforms/ios/build/emulator
  zip -r $TEMP/HttpDemo.app.zip ./HttpDemo.app
  popd

  curl -u $SAUCE_USERNAME:$SAUCE_ACCESS_KEY \
      -X POST \
      -H "Content-Type: application/octet-stream" \
      https://saucelabs.com/rest/v1/storage/$SAUCE_USERNAME/HttpDemo.app.zip?overwrite=true \
      --data-binary @$TEMP/HttpDemo.app.zip
fi
