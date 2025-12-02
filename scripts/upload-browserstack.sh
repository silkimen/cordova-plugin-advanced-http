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
  rm -rf "$TEMP/HttpDemo.ipa"
  IOS_BUILD_DIR="$TEMP/platforms/ios/build/Debug-iphonesimulator"
  APP_PATH="$IOS_BUILD_DIR/HttpDemo.app"
  if [ ! -d "$APP_PATH" ]; then
    echo "Unable to locate $APP_PATH" >&2
    exit 1
  fi

  PAYLOAD_DIR="$TEMP/Payload"
  rm -rf "$PAYLOAD_DIR"
  mkdir -p "$PAYLOAD_DIR"
  cp -R "$APP_PATH" "$PAYLOAD_DIR/HttpDemo.app"
  (cd "$TEMP" && zip -qr HttpDemo.ipa Payload)
  rm -rf "$PAYLOAD_DIR"

  curl -u $BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY \
      -X POST \
      https://api-cloud.browserstack.com/app-automate/upload \
      -F "file=@$TEMP/HttpDemo.ipa" \
      -F "data={\"custom_id\": \"HttpTestAppIos\"}"
fi
