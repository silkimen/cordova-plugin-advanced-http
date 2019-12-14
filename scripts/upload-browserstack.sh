#!/usr/bin/env bash
set -e

PLATFORM=$([[ "${@#--android}" = "$@" ]] && echo "ios" || echo "android")
ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )"; cd ..; pwd )"
TEMP=$ROOT/temp

if [ -z $BROWSERSTACK_USERNAME ] || [ -z $BROWSERSTACK_ACCESS_KEY ]; then
  echo "Skipping uploading artifact, because BrowserStack credentials are not set.";
  exit 0;
fi

if [ $PLATFORM = "android" ]; then
  curl -u $BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY \
      -X POST \
      https://api-cloud.browserstack.com/app-automate/upload \
      -F "file=@$TEMP/platforms/android/app/build/outputs/apk/debug/app-debug.apk" \
      -F "data={\"custom_id\": \"HttpTestAppAndroid\"}"
else
  rm -rf $TEMP/HttpDemo.ipa
  pushd $TEMP/platforms/ios/build/emulator
  rm -rf ./Payload
  mkdir -p ./Payload
  cp -r ./HttpDemo.app ./Payload/HttpDemo.app
  zip -r $TEMP/HttpDemo.ipa ./Payload
  popd

  curl -u $BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY \
      -X POST \
      https://api-cloud.browserstack.com/app-automate/upload \
      -F "file=@$TEMP/HttpDemo.ipa" \
      -F "data={\"custom_id\": \"HttpTestAppIos\"}"
fi
