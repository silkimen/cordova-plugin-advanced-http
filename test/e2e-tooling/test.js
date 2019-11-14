const wd = require('wd');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const logging = require('./logging');
const capsConfig = require('./caps');
const serverConfig = require('./server');
const testDefinitions = require('../e2e-specs');

chai.use(chaiAsPromised);
chaiAsPromised.transferPromiseness = wd.transferPromiseness;
global.should = chai.should();

describe('Advanced HTTP e2e test suite', function () {
  const isSauceLabs = !!process.env.SAUCE_USERNAME;
  const isVerbose = process.argv.includes('--verbose');
  const isDevice = process.argv.includes('--device');
  const isAndroid = process.argv.includes('--android');

  const targetInfo = { isSauceLabs, isDevice, isAndroid };
  const environment = isSauceLabs ? 'saucelabs' : 'local';

  let driver;
  let allPassed = true;

  this.timeout(900000);

  before(async function () {
    driver = await wd.promiseChainRemote(serverConfig.getServer(environment));

    if (isVerbose) {
      logging.setupLogging(driver);
    }

    await driver.init(
      capsConfig.getCaps(
        environment,
        isAndroid ? 'android' : 'ios',
        isDevice ? 'device' : 'emulator'
      )
    );
  });

  after(async function () {
    await driver.quit().finally(
      () => isSauceLabs && driver.sauceJobStatus(allPassed)
    );
  });

  testDefinitions.tests.forEach((definition, index) => {
    it(index + ': ' + definition.description, function () {
      return clickNext(driver)
        .then(() => validateTestIndex(driver, index))
        .then(() => validateTestTitle(driver, definition.description))
        .then(() => waitToBeFinished(driver, definition.timeout || 10000))
        .then(() => validateResult(driver, definition.validationFunc, targetInfo))
    });
  });
});

async function clickNext(driver) {
  await driver.elementById('nextBtn').click().sleep(1000);
}

async function validateTestIndex(driver, testIndex) {
  const description = await driver.elementById('descriptionLbl').text();
  const index = parseInt(description.match(/(\d+):/)[1], 10);

  index.should.be.equal(testIndex, 'Test index is not matching!');
}

async function validateTestTitle(driver, testTitle) {
  const description = await driver.elementById('descriptionLbl').text();
  const title = description.match(/\d+:\ (.*)/)[1];

  title.should.be.equal(testTitle, 'Test description is not matching!');
}

async function waitToBeFinished(driver, timeout) {
  const timeoutTimestamp = Date.now() + timeout;

  while (true) {
    if (await driver.elementById('statusInput').getValue() === 'finished') {
      return true;
    }

    if (Date.now() > timeoutTimestamp) {
      throw new Error('Test function timed out!');
    }

    await sleep(500);
  }
}

async function validateResult(driver, validationFunc, targetInfo) {
  const result = await driver.safeExecute('app.lastResult');
  validationFunc(driver, result, targetInfo);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
