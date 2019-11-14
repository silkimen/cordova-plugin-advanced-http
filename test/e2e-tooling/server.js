module.exports = { getServer };

const configs = {
  local: {
    host: 'localhost',
    port: 4723
  },
  saucelabs: {
    host: 'ondemand.saucelabs.com',
    port: 80,
    auth: process.env.SAUCE_USERNAME + ":" + process.env.SAUCE_ACCESS_KEY
  }
}

function getServer(environment) {
  return configs[environment.toLowerCase()];
}
