module.exports = { getCaps };

const path = require('path');

const configs = {
  // testing on local machine
  localIosDevice: {
    platformName: 'iOS',
    platformVersion: '10.3',
    automationName: 'XCUITest',
    deviceName: 'iPhone 8',
    autoWebview: true,
    app: path.resolve('temp/platforms/ios/build/emulator/HttpDemo.app')
  },
  localIosEmulator: {
    platformName: 'iOS',
    platformVersion: '14.3',
    automationName: 'XCUITest',
    deviceName: 'iPhone 8',
    autoWebview: true,
    app: path.resolve('temp/platforms/ios/build/emulator/HttpDemo.app')
  },
  localAndroidEmulator: {
    platformName: 'Android',
    platformVersion: '9',
    deviceName: 'Android Emulator',
    autoWebview: true,
    fullReset: true,
    app: path.resolve('temp/platforms/android/app/build/outputs/apk/debug/app-debug.apk')
  },

  // testing on SauceLabs
  saucelabsIosDevice: {
    browserName: '',
    'appium-version': '1.20.1',
    platformName: 'iOS',
    platformVersion: '14.3',
    deviceName: 'iPhone 6',
    autoWebview: true,
    app: 'sauce-storage:HttpDemo.app.zip'
  },
  saucelabsIosEmulator: {
    browserName: '',
    'appium-version': '1.20.1',
    platformName: 'iOS',
    platformVersion: '14.3',
    deviceName: 'iPhone Simulator',
    autoWebview: true,
    app: 'sauce-storage:HttpDemo.app.zip'
  },
  saucelabsAndroidEmulator: {
    browserName: '',
    'appium-version': '1.20.1',
    platformName: 'Android',
    platformVersion: '8.0',
    deviceName: 'Android Emulator',
    autoWebview: true,
    app: 'sauce-storage:HttpDemo.apk'
  },

  // testing on BrowserStack
  browserstackIosDevice: {
    device: 'iPhone 12',
    os_version: '14',
    project: 'HTTP Test App',
    autoWebview: true,
    app: 'HttpTestAppIos',
    'browserstack.networkLogs': false
  },
  browserstackAndroidDevice: {
    device: 'Google Nexus 6',
    os_version: '6.0',
    project: 'HTTP Test App',
    autoWebview: true,
    app: 'HttpTestAppAndroid',
    'browserstack.networkLogs': false
  }
};

function getCaps(environment, os, runtime) {
  const key = environment.toLowerCase() + capitalize(os) + capitalize(runtime);
  const caps = configs[key];

  caps.name = `cordova-plugin-advanced-http (${os})`;

  return caps;
};

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
