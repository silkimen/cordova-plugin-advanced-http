const local = {
  iosDevice: {
    platformName: 'iOS',
    platformVersion: '10.3',
    deviceName: 'iPhone 6',
    autoWebview: true,
    app: undefined // will be set later
  },
  iosEmulator: {
    platformName: 'iOS',
    platformVersion: '11.0',
    deviceName: 'iPhone Simulator',
    autoWebview: true,
    app: undefined // will be set later
  },
  androidEmulator: {
    platformName: 'Android',
    platformVersion: '5.1',
    deviceName: 'Android Emulator',
    autoWebview: true,
    fullReset: true,
    app: undefined // will be set later
  }
};

const sauce = {
  iosDevice: {
    browserName: '',
    'appium-version': '1.7.1',
    platformName: 'iOS',
    platformVersion: '10.3',
    deviceName: 'iPhone 6',
    autoWebview: true,
    app: undefined // will be set later
  },
  iosEmulator: {
    browserName: '',
    'appium-version': '1.7.1',
    platformName: 'iOS',
    platformVersion: '10.3',
    deviceName: 'iPhone Simulator',
    autoWebview: true,
    app: undefined // will be set later
  },
  androidEmulator: {
    browserName: '',
    'appium-version': '1.7.1',
    platformName: 'Android',
    platformVersion: '5.1',
    deviceName: 'Android Emulator',
    autoWebview: true,
    app: undefined // will be set later
  }
};

if (process.env.SAUCE_USERNAME) {
  module.exports = sauce;
} else {
  module.exports = local;
}
