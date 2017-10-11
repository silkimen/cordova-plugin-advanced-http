const app = {
  testIndex: -1,

  initialize: function() {
    document.getElementById('nextBtn').addEventListener('click', app.onNextBtnClick);
  },

  print: function(prefix, content) {
    const text = '\n' + prefix + ': ' + JSON.stringify(content);

    document.getElementById('resultTextarea').value += text;
  },

  reject: function(content) {
    app.print('result - rejected', content);
  },

  resolve: function(content) {
    app.print('result - resolved', content);
  },

  runTest: function(index) {
    const testDefinition = tests[index];
    const titleText = app.testIndex + ': ' + testDefinition.description;
    const resultText = 'expectation - ' + testDefinition.expected;

    document.getElementById('resultTextarea').value = resultText;
    document.getElementById('descriptionLbl').innerText = titleText;
    testDefinition.func(index);
  },

  onFinishedAllTests: function() {
    const titleText = 'No more tests';
    const resultText = 'You have run all available tests.';

    document.getElementById('resultTextarea').value = resultText;
    document.getElementById('descriptionLbl').innerText = titleText;
  },

  onNextBtnClick: function() {
    app.testIndex += 1;

    if (app.testIndex < tests.length) {
      app.runTest(app.testIndex);
    } else {
      app.onFinishedAllTests();
    }
  }
};

app.initialize();
