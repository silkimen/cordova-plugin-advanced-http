/* global hooks, tests */

const app = {
  testIndex: -1,

  lastResult: null,

  testsFlaggedToRun: [],

  initialize: function () {
    document.getElementById('nextBtn').addEventListener('click', app.onNextBtnClick);

    var onlyFlaggedTests = [];
    var enabledTests = [];

    tests.forEach(function (test) {
      if (test.only) {
        onlyFlaggedTests.push(test);
      }

      if (!test.disabled) {
        enabledTests.push(test);
      }
    });

    app.testsFlaggedToRun = onlyFlaggedTests.length ? onlyFlaggedTests : enabledTests;
  },

  printResult: function (prefix, content) {
    const text = prefix + ': ' + JSON.stringify(content);

    document.getElementById('resultTextarea').value += text;
  },

  reject: function (content) {
    document.getElementById('statusInput').value = 'finished';
    app.printResult('result - rejected', content);

    app.lastResult = {
      type: 'rejected',
      data: content
    };
  },

  resolve: function (content) {
    document.getElementById('statusInput').value = 'finished';
    app.printResult('result - resolved', content);

    app.lastResult = {
      type: 'resolved',
      data: content
    };
  },

  skip: function (content) {
    document.getElementById('statusInput').value = 'finished';
    app.printResult('result - skipped', content);

    app.lastResult = {
      type: 'skipped',
      data: content
    };
  },

  throw: function (error) {
    document.getElementById('statusInput').value = 'finished';
    app.printResult('result - throwed', error.message);

    app.lastResult = {
      type: 'throwed',
      message: error.message
    };
  },

  getResult: function (cb) {
    cb(app.lastResult);
  },

  runTest: function (tests, index) {
    const testDefinition = tests[index];
    const titleText = index + ': ' + testDefinition.description;
    const expectedText = 'expected - ' + testDefinition.expected;

    document.getElementById('statusInput').value = 'running';
    document.getElementById('expectedTextarea').value = expectedText;
    document.getElementById('resultTextarea').value = '';
    document.getElementById('descriptionLbl').innerText = titleText;

    const onSuccessFactory = function (cbChain) {
      return function () {
        cbChain.shift()(cbChain);
      }
    };

    const onFailFactory = function (prefix) {
      return function (errorMessage) {
        app.reject(prefix + ': ' + errorMessage);
      }
    };

    const onThrowedHandler = function (prefix, error) {
      app.throw(new Error(prefix + ': ' + error.message));
    };

    const execBeforeEachTest = function (cbChain) {
      const prefix = 'in before each hook';

      try {
        if (!hooks || !hooks.onBeforeEachTest) {
          return onSuccessFactory(cbChain)();
        }

        hooks.onBeforeEachTest(
          onSuccessFactory(cbChain),
          onFailFactory(prefix)
        );
      } catch (error) {
        onThrowedHandler(prefix, error);
      }
    };

    const execBeforeTest = function (cbChain) {
      const prefix = 'in before hook';

      try {
        if (!testDefinition.before) {
          return onSuccessFactory(cbChain)();
        }

        testDefinition.before(
          onSuccessFactory(cbChain),
          onFailFactory(prefix)
        );
      } catch (error) {
        onThrowedHandler(prefix, error);
      }
    };

    const execTest = function () {
      try {
        testDefinition.func(app.resolve, app.reject, app.skip);
      } catch (error) {
        app.throw(error);
      }
    };

    onSuccessFactory([execBeforeEachTest, execBeforeTest, execTest])();
  },

  onFinishedAllTests: function () {
    const titleText = 'No more tests';
    const expectedText = 'You have run all available tests.';

    document.getElementById('expectedTextarea').value = expectedText;
    document.getElementById('resultTextarea').value = '';
    document.getElementById('descriptionLbl').innerText = titleText;
  },

  onNextBtnClick: function () {
    app.testIndex += 1;

    if (app.testIndex < app.testsFlaggedToRun.length) {
      app.runTest(app.testsFlaggedToRun, app.testIndex);
    } else {
      app.onFinishedAllTests();
    }
  }
};

app.initialize();
