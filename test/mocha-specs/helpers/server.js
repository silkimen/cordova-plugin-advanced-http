const local = {
  host: 'localhost',
  port: 4723
};

const sauce = {
  host: 'ondemand.saucelabs.com',
  port: 80,
  auth: process.env.SAUCE_USERNAME + ":" + process.env.SAUCE_ACCESS_KEY
};

if (process.env.SAUCE_USERNAME) {
  module.exports = sauce;
} else {
  module.exports = local;
}
