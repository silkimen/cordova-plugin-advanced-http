#!/usr/bin/env bash
set -e

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
CDV=$ROOT/node_modules/.bin/cordova

rm -rf $ROOT/temp
$CDV create $ROOT/temp
cd $ROOT/temp
$CDV platforms add android
$CDV platforms add ios
$CDV plugins add $ROOT
