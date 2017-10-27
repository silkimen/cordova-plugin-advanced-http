const app = {
  testIndex: -1,

  lastResult: null,

  initialize: function() {
    document.getElementById('nextBtn').addEventListener('click', app.onNextBtnClick);
  },

  printResult: function(prefix, content) {
    const text = prefix + ': ' + JSON.stringify(content);

    document.getElementById('resultTextarea').value += text;
  },

  reject: function(content) {
    document.getElementById('statusInput').value = 'finished';
    app.printResult('result - rejected', content);

    app.lastResult = {
      type: 'rejected',
      data: content
    };
  },

  resolve: function(content) {
    document.getElementById('statusInput').value = 'finished';
    app.printResult('result - resolved', content);

    app.lastResult = {
      type: 'resolved',
      data: content
    };
  },

  getResult: function(cb) {
    cb(app.lastResult);
  },

  runTest: function(index) {
    const testDefinition = tests[index];
    const titleText = app.testIndex + ': ' + testDefinition.description;
    const expectedText = 'expected - ' + testDefinition.expected;

    document.getElementById('statusInput').value = 'running';
    document.getElementById('expectedTextarea').value = expectedText;
    document.getElementById('resultTextarea').value = '';
    document.getElementById('descriptionLbl').innerText = titleText;
    testDefinition.func(app.resolve, app.reject);
  },

  onBeforeTest: function(testIndex, cb) {
    app.lastResult = null;

    if (hooks && hooks.onBeforeEachTest) {
      return hooks.onBeforeEachTest(function() {
        const testDefinition = tests[testIndex];

        if (testDefinition.before) {
          testDefinition.before(cb);
        } else {
          cb();
        }
      });
    } else {
      cb();
    }
  },

  onFinishedAllTests: function() {
    const titleText = 'No more tests';
    const expectedText = 'You have run all available tests.';

    document.getElementById('expectedTextarea').value = expectedText;
    document.getElementById('resultTextarea').value = '';
    document.getElementById('descriptionLbl').innerText = titleText;
  },

  onNextBtnClick: function() {
    app.testIndex += 1;

    if (app.testIndex < tests.length) {
      app.onBeforeTest(app.testIndex, function() {
        app.runTest(app.testIndex);
      });
    } else {
      app.onFinishedAllTests();
    }
  }
};

app.initialize();
