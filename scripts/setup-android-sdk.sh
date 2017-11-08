#!/usr/bin/env bash
set -e

curl http://dl.google.com/android/android-sdk_r24.4-macosx.zip -o android-sdk-macosx.zip
tar -xvf android-sdk-macosx.zip

echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter platform-tools
echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter build-tools-25.0.0
echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter android-25
echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter extra-android-support
echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter extra-android-m2repository
echo y | ./android-sdk-macosx/tools/android update sdk --no-ui --all --filter extra-google-m2repository
