const wd = require('wd');
const chai = require('chai');
const logging = require('./logging');
const capsConfig = require('./caps');
const serverConfig = require('./server');
const testDefinitions = require('../e2e-specs');

global.should = chai.should();

describe('Advanced HTTP e2e test suite', function () {
  const isSauceLabs = !!process.env.SAUCE_USERNAME;
  const isBrowserStack = !!process.env.BROWSERSTACK_USERNAME;
  const isVerbose = process.argv.includes('--verbose');
  const isDevice = process.argv.includes('--device');
  const isAndroid = process.argv.includes('--android');

  const targetInfo = { isSauceLabs, isBrowserStack, isDevice, isAndroid };
  const environment = isSauceLabs ? 'saucelabs' : isBrowserStack ? 'browserstack' : 'local';

  let driver;
  let allPassed = true;

  this.timeout(15000);
  this.slow(4000);

  before(async function () {
    // connecting to saucelabs can take some time
    this.timeout(300000);

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

  const defineTestForMocha = (test, index) => {
    it(index + ': ' + test.description, async function() {
      await clickNext(driver);
      await validateTestIndex(driver, index);
      await validateTestTitle(driver, test.description);
      await waitToBeFinished(driver, test.timeout || 10000);
      var skipped = await checkSkipped(driver);
      if(skipped){
        this.skip();
      }
      await validateResult(driver, test.validationFunc, targetInfo);
    });
  };

  const onlyFlaggedTests = [];
  const enabledTests = [];

  testDefinitions.tests.forEach(test => {
    if (test.only) {
      onlyFlaggedTests.push(test);
    }

    if (!test.disabled) {
      enabledTests.push(test);
    }
  });

  if (onlyFlaggedTests.length) {
    onlyFlaggedTests.forEach(defineTestForMocha);
  } else {
    enabledTests.forEach(defineTestForMocha);
  }
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

async function checkSkipped(driver) {
  const result = await driver.safeExecute('app.lastResult');
  return result.type === 'skipped';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
