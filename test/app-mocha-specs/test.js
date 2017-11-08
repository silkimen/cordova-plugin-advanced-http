require('./helpers/setup');

const wd = require('wd');
const apps = require('./helpers/apps');
const caps = Object.assign({}, require('./helpers/caps'));
const serverConfig = require('./helpers/server');
const testDefinitions = require('../app-test-definitions');
const pkgjson = require('../../package.json');

describe('Advanced HTTP', function() {
  const isDevice = process.argv.includes('--device');
  const isAndroid = process.argv.includes('--android');
  const targetInfo = { isDevice, isAndroid };

  let driver = null;
  let allPassed = true;

  this.timeout(900000);

  const getCaps = appName => {
    const desiredOs = isAndroid ? 'android' : 'ios';
    const desiredCaps = caps[desiredOs + (isDevice ? 'Device' : 'Emulator')];
    const desiredApp = apps[desiredOs + appName];

    desiredCaps.name = pkgjson.name + ` (${desiredOs})`;
    desiredCaps.app = desiredApp;

    return desiredCaps;
  };

  const validateTestIndex = number => driver
    .elementById('descriptionLbl')
    .text()
    .then(text => parseInt(text.match(/(\d+):/)[1], 10))
    .should.eventually.become(number, 'Test index is not matching!');

  const validateTestTitle = testTitle => driver
    .elementById('descriptionLbl')
    .text()
    .then(text => text.match(/\d+:\ (.*)/)[1])
    .should.eventually.become(testTitle, 'Test description is not matching!');

  const waitToBeFinished = timeout => new Promise((resolve, reject) => {
    const timeoutTimestamp = Date.now() + timeout;
    const checkIfFinished = () => driver
      .elementById('statusInput')
      .getValue()
      .then(value => {
        if (value === 'finished') {
          resolve();
        } else if (Date.now() > timeoutTimestamp) {
          reject('Test function timed out!');
        } else {
          setTimeout(checkIfFinished, 500);
        }
      });

    checkIfFinished();
  });

  const validateResult = testDefinition => driver
    .safeExecute('app.lastResult')
    .then(result => testDefinition.validationFunc(driver, result, targetInfo));

  const clickNext = () => driver
    .elementById('nextBtn')
    .click()
    .sleep(1000);

  before(() => {
    driver = wd.promiseChainRemote(serverConfig);
    require('./helpers/logging').configure(driver);

    return driver.init(getCaps('TestApp'));
  });

  after(() => driver
    .quit()
    .finally(function () {
      if (process.env.SAUCE_USERNAME) {
        return driver.sauceJobStatus(allPassed);
      }
    }));

  testDefinitions.tests.forEach((definition, index) => {
    it(definition.description, function() {
      return clickNext()
        .then(() => validateTestIndex(index))
        .then(() => validateTestTitle(this.test.title))
        .then(() => waitToBeFinished(definition.timeout || 10000))
        .then(() => validateResult(definition))
      });
  });
});
