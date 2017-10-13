const app = {
  testIndex: -1,

  initialize: function() {
    document.getElementById('nextBtn').addEventListener('click', app.onNextBtnClick);
  },

  printResult: function(prefix, content) {
    const text = prefix + ': ' + JSON.stringify(content);

    document.getElementById('resultTextarea').value += text;
  },

  reject: function(content) {
    app.printResult('result - rejected', content);
  },

  resolve: function(content) {
    app.printResult('result - resolved', content);
  },

  runTest: function(index) {
    const testDefinition = tests[index];
    const titleText = app.testIndex + ': ' + testDefinition.description;
    const expectedText = 'expected - ' + testDefinition.expected;

    document.getElementById('expectedTextarea').value = expectedText;
    document.getElementById('resultTextarea').value = '';
    document.getElementById('descriptionLbl').innerText = titleText;
    testDefinition.func(app.resolve, app.reject);
  },

  onBeforeTest: function(testIndex, cb) {
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
