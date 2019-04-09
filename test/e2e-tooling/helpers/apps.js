const path = require('path');

if (process.env.SAUCE_USERNAME) {
  exports.iosTestApp = 'sauce-storage:HttpDemo.app.zip';
  exports.androidTestApp = 'sauce-storage:HttpDemo.apk';
} else {
  // these paths are relative to working directory
  exports.iosTestApp = path.resolve('temp/platforms/ios/build/emulator/HttpDemo.app');
  exports.androidTestApp = path.resolve('temp/platforms/android/app/build/outputs/apk/debug/app-debug.apk');
}
