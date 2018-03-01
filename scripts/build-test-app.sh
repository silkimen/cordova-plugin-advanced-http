#!/usr/bin/env bash
set -e

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
CDV=$ROOT/node_modules/.bin/cordova

PLATFORM=ios
TARGET=emulator

while :; do
  case $1 in
    --android)
      PLATFORM=android
      ;;
    --browser)
      PLATFORM=browser
      ;;
    --ios)
      PLATFORM=ios
      ;;
    --device)
      TARGET=device
      ;;
    --emulator)
      TARGET=emulator
      ;;
    -?*)
      printf 'WARN: Unknown option (ignored): %s\n' "$1" >&2
      ;;
    *)
      break
   esac

   shift
done

rm -rf $ROOT/temp
mkdir $ROOT/temp
cp -r $ROOT/test/app-template/ $ROOT/temp/
cp $ROOT/test/app-test-definitions.js $ROOT/temp/www/
cd $ROOT/temp
$CDV prepare
$CDV plugins add $ROOT
$CDV build $PLATFORM --$TARGET
