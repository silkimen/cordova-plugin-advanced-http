#!/usr/bin/env bash
set -e

while getopts a:b: option; do
  case "${option}" in
    a) API_LEVEL=${OPTARG};;
    b) BUILD_TOOLS_VERSION=${OPTARG};;
  esac
done

curl http://dl.google.com/android/android-sdk_r24.4-macosx.zip -o android-sdk-macosx.zip
tar -xvf android-sdk-macosx.zip

echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter platform-tools
echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter build-tools-${BUILD_TOOLS_VERSION}
echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter android-${API_LEVEL}
echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter extra-android-support
echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter extra-android-m2repository
echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter extra-google-m2repository
