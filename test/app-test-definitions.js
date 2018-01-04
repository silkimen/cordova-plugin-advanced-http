const hooks = {
  onBeforeEachTest: function(done) {
    cordova.plugin.http.clearCookies();
    cordova.plugin.http.acceptAllCerts(false, done, done);
  }
};

const helpers = {
  acceptAllCerts: function(done) { cordova.plugin.http.acceptAllCerts(true, done, done); },
  setJsonSerializer: function(done) { done(cordova.plugin.http.setDataSerializer('json')); },
  setUrlEncodedSerializer: function(done) { done(cordova.plugin.http.setDataSerializer('urlencoded')); },
  getWithXhr: function(done, url) {
    var xhr = new XMLHttpRequest();

    xhr.addEventListener('load', function() {
      done(this.responseText);
    });

    xhr.open('GET', url);
    xhr.send();
  },
  writeToFile: function (done, fileName, content) {
    window.resolveLocalFileSystemURL(cordova.file.cacheDirectory, function (directoryEntry) {
      directoryEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
          var blob = new Blob([ content ], { type: 'text/plain' });

          fileWriter.onwriteend = done;
          fileWriter.onerror = done;
          fileWriter.write(blob);
        }, done);
      }, done);
    }, done);
  }
};

const tests = [
  {
    description: 'should reject self signed cert (GET)',
    expected: 'rejected: {"status":-1,"error":"cancelled"}',
    func: function(resolve, reject) { cordova.plugin.http.get('https://self-signed.badssl.com/', {}, {}, resolve, reject); },
    validationFunc: function(driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -1, error: targetInfo.isAndroid ? 'SSL handshake failed' : 'cancelled' });
    }
  },{
    description: 'should reject self signed cert (PUT)',
    expected: 'rejected: {"status":-1,"error":"cancelled"}',
    func: function(resolve, reject) { cordova.plugin.http.put('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -1, error: targetInfo.isAndroid ? 'SSL handshake failed' : 'cancelled' });
    }
  },{
    description: 'should reject self signed cert (POST)',
    expected: 'rejected: {"status":-1,"error":"cancelled"}',
    func: function(resolve, reject) { cordova.plugin.http.post('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -1, error: targetInfo.isAndroid ? 'SSL handshake failed' : 'cancelled' });
    }
  },{
    description: 'should reject self signed cert (PATCH)',
    expected: 'rejected: {"status":-1,"error":"cancelled"}',
    func: function(resolve, reject) { cordova.plugin.http.patch('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -1, error: targetInfo.isAndroid ? 'SSL handshake failed' : 'cancelled' });
    }
  },{
    description: 'should reject self signed cert (DELETE)',
    expected: 'rejected: {"status":-1,"error":"cancelled"}',
    func: function(resolve, reject) { cordova.plugin.http.delete('https://self-signed.badssl.com/', {}, {}, resolve, reject); },
    validationFunc: function(driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -1, error: targetInfo.isAndroid ? 'SSL handshake failed' : 'cancelled' });
    }
  },{
    description: 'should accept bad cert (GET)',
    expected: 'resolved: {"status":200, ...',
    before: helpers.acceptAllCerts,
    func: function(resolve, reject) { cordova.plugin.http.get('https://self-signed.badssl.com/', {}, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      result.data.should.include({ status: 200 });
    }
  },{
    description: 'should accept bad cert (PUT)',
    expected: 'rejected: {"status":405, ... // will be rejected because PUT is not allowed',
    before: helpers.acceptAllCerts,
    func: function(resolve, reject) { cordova.plugin.http.put('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('rejected');
      result.data.should.include({ status: 405 });
    }
  },{
    description: 'should accept bad cert (POST)',
    expected: 'rejected: {"status":405, ... // will be rejected because POST is not allowed',
    before: helpers.acceptAllCerts,
    func: function(resolve, reject) { cordova.plugin.http.post('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('rejected');
      result.data.should.include({ status: 405 });
    }
  },{
    description: 'should accept bad cert (PATCH)',
    expected: 'rejected: {"status":405, ... // will be rejected because PATCH is not allowed',
    before: helpers.acceptAllCerts,
    func: function(resolve, reject) { cordova.plugin.http.patch('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('rejected');
      result.data.should.include({ status: 405 });
    }
  },{
    description: 'should accept bad cert (DELETE)',
    expected: 'rejected: {"status":405, ... // will be rejected because DELETE is not allowed',
    before: helpers.acceptAllCerts,
    func: function(resolve, reject) { cordova.plugin.http.delete('https://self-signed.badssl.com/', {}, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('rejected');
      result.data.should.include({ status: 405 });
    }
  },{
    description: 'should fetch data from http://httpbin.org/ (GET)',
    expected: 'resolved: {"status":200, ...',
    before: helpers.acceptAllCerts,
    func: function(resolve, reject) { cordova.plugin.http.get('http://httpbin.org/', {}, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      result.data.should.include({ status: 200 });
    }
  },{
    description: 'should send JSON object correctly (POST)',
    expected: 'resolved: {"status": 200, "data": "{\\"json\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setJsonSerializer,
    func: function(resolve, reject) { cordova.plugin.http.post('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql({ test: 'testString' });
    }
  },{
    description: 'should send JSON object correctly (PUT)',
    expected: 'resolved: {"status": 200, "data": "{\\"json\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setJsonSerializer,
    func: function(resolve, reject) { cordova.plugin.http.put('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql({ test: 'testString' });
    }
  },{
    description: 'should send JSON object correctly (PATCH)',
    expected: 'resolved: {"status": 200, "data": "{\\"json\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setJsonSerializer,
    func: function(resolve, reject) { cordova.plugin.http.patch('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql({ test: 'testString' });
    }
  },{
    description: 'should send JSON array correctly (POST) #26',
    expected: 'resolved: {"status": 200, "data": "[ 1, 2, 3 ]\" ...',
    before: helpers.setJsonSerializer,
    func: function(resolve, reject) { cordova.plugin.http.post('http://httpbin.org/anything', [ 1, 2, 3 ], {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql([ 1, 2, 3 ]);
    }
  },{
    description: 'should send JSON array correctly (PUT) #26',
    expected: 'resolved: {"status": 200, "data": "[ 1, 2, 3 ]\" ...',
    before: helpers.setJsonSerializer,
    func: function(resolve, reject) { cordova.plugin.http.put('http://httpbin.org/anything', [ 1, 2, 3 ], {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql([ 1, 2, 3 ]);
    }
  },{
    description: 'should send JSON array correctly (PATCH) #26',
    expected: 'resolved: {"status": 200, "data": "[ 1, 2, 3 ]\" ...',
    before: helpers.setJsonSerializer,
    func: function(resolve, reject) { cordova.plugin.http.patch('http://httpbin.org/anything', [ 1, 2, 3 ], {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      result.data.data.should.be.a('string');
      JSON.parse(result.data.data).json.should.eql([ 1, 2, 3 ]);
    }
  },{
    description: 'should send url encoded data correctly (POST) #41',
    expected: 'resolved: {"status": 200, "data": "{\\"form\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setUrlEncodedSerializer,
    func: function(resolve, reject) { cordova.plugin.http.post('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).form.should.eql({ test: 'testString' });
    }
  },{
    description: 'should send url encoded data correctly (PUT)',
    expected: 'resolved: {"status": 200, "data": "{\\"form\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setUrlEncodedSerializer,
    func: function(resolve, reject) { cordova.plugin.http.put('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).form.should.eql({ test: 'testString' });
    }
  },{
    description: 'should send url encoded data correctly (PATCH)',
    expected: 'resolved: {"status": 200, "data": "{\\"form\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setUrlEncodedSerializer,
    func: function(resolve, reject) { cordova.plugin.http.patch('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).form.should.eql({ test: 'testString' });
    }
  },{
    description: 'should resolve correct URL after redirect (GET) #33',
    expected: 'resolved: {"status": 200, url: "http://httpbin.org/anything", ...',
    func: function(resolve, reject) { cordova.plugin.http.get('http://httpbin.org/redirect-to?url=http://httpbin.org/anything', {}, {}, resolve, reject); },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      result.data.url.should.be.equal('http://httpbin.org/anything');
    }
  },{
    description: 'should download a file from given URL to given path in local filesystem',
    expected: 'resolved: {"content": "<?xml version=\'1.0\' encoding=\'us-ascii\'?>\\n\\n<!--  A SAMPLE set of slides  -->" ...',
    func: function(resolve, reject) {
      var sourceUrl = 'http://httpbin.org/xml';
      var targetPath = cordova.file.cacheDirectory + 'test.xml';

      cordova.plugin.http.downloadFile(sourceUrl, {}, {}, targetPath, function(entry) {
        helpers.getWithXhr(function(content) {
          resolve({
            sourceUrl: sourceUrl,
            targetPath: targetPath,
            fullPath: entry.fullPath,
            name: entry.name,
            content: content
          });
        }, targetPath);
      }, reject);
    },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      result.data.name.should.be.equal('test.xml');
      result.data.content.should.be.equal("<?xml version='1.0' encoding='us-ascii'?>\n\n<!--  A SAMPLE set of slides  -->\n\n<slideshow \n    title=\"Sample Slide Show\"\n    date=\"Date of publication\"\n    author=\"Yours Truly\"\n    >\n\n    <!-- TITLE SLIDE -->\n    <slide type=\"all\">\n      <title>Wake up to WonderWidgets!</title>\n    </slide>\n\n    <!-- OVERVIEW -->\n    <slide type=\"all\">\n        <title>Overview</title>\n        <item>Why <em>WonderWidgets</em> are great</item>\n        <item/>\n        <item>Who <em>buys</em> WonderWidgets</item>\n    </slide>\n\n</slideshow>");
    }
  },{
    description: 'should upload a file from given path in local filesystem to given URL #27',
    expected: 'resolved: {"status": 200, "data": "files": {"test-file.txt": "I am a dummy file. I am used ...',
    func: function(resolve, reject) {
      var fileName = 'test-file.txt';
      var fileContent = 'I am a dummy file. I am used for testing purposes!';
      var sourcePath = cordova.file.cacheDirectory + fileName;
      var targetUrl = 'http://httpbin.org/post';

      helpers.writeToFile(function() {
        cordova.plugin.http.uploadFile(targetUrl, {}, {}, sourcePath, fileName, resolve, reject);
      }, fileName, fileContent);
    },
    validationFunc: function(driver, result) {
      var fileName = 'test-file.txt';
      var fileContent = 'I am a dummy file. I am used for testing purposes!';

      result.type.should.be.equal('resolved');
      result.data.data.should.be.a('string');

      JSON
        .parse(result.data.data)
        .files[fileName]
        .should.be.equal(fileContent);
    }
  },{
    description: 'should encode HTTP array params correctly (GET) #45',
    expected: 'resolved: {"status": 200, "data": "{\\"url\\":\\"http://httpbin.org/get?myArray[]=val1&myArray[]=val2&myArray[]=val3\\"}\" ...',
    func: function(resolve, reject) {
      cordova.plugin.http.get('http://httpbin.org/get', { myArray: [ 'val1', 'val2', 'val3' ], myString: 'testString' }, {}, resolve, reject);
    },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      result.data.data.should.be.a('string');

      JSON
        .parse(result.data.data)
        .url
        .should.be.equal('http://httpbin.org/get?myArray[]=val1&myArray[]=val2&myArray[]=val3&myString=testString');
    }
  },{
    description: 'should reject non-string values in local header object #54',
    expected: 'rejected: {"status": 0, "error": "advanced-http: header values must be strings" ...',
    func: function(resolve, reject) {
      cordova.plugin.http.get('http://httpbin.org/get', {}, { myTestHeader: 1 }, resolve, reject);
    },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('rejected');
      result.data.error.should.be.equal('advanced-http: header values must be strings');
    }
  },{
    description: 'should throw an error while setting non-string value as global header #54',
    expected: 'throwed: "advanced-http: header values must be strings"',
    func: function(resolve, reject) {
      cordova.plugin.http.setHeader('myTestHeader', 2);
    },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('throwed');
      result.message.should.be.equal('advanced-http: header values must be strings');
    }
  },{
    description: 'should accept content-type "application/xml" #58',
    expected: 'resolved: {"status": 200, ...',
    func: function(resolve, reject) {
      cordova.plugin.http.get('http://httpbin.org/xml', {}, {}, resolve, reject);
    },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      result.data.status.should.be.equal(200);
    }
  },{
    description: 'should send programmatically set cookies correctly (GET)',
    expected: 'resolved: {"status": 200, ...',
    func: function(resolve, reject) {
      cordova.plugin.http.setCookie('http://httpbin.org/get', 'myCookie=myValue');
      cordova.plugin.http.setCookie('http://httpbin.org/get', 'mySecondCookie=mySecondValue');
      cordova.plugin.http.get('http://httpbin.org/get', {}, {}, resolve, reject);
    },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      result.data.data.should.be.a('string');

      JSON
        .parse(result.data.data)
        .headers
        .Cookie
        .should.be.equal('myCookie=myValue; mySecondCookie=mySecondValue');
    }
  },{
    description: 'should send programmatically set cookies correctly (DOWNLOAD) #57',
    expected: 'resolved: {"content":{"cookies":{"myCookie":"myValue ...',
    func: function(resolve, reject) {
      var sourceUrl = 'http://httpbin.org/cookies';
      var targetPath = cordova.file.cacheDirectory + 'cookies.json';

      cordova.plugin.http.setCookie('http://httpbin.org/get', 'myCookie=myValue');
      cordova.plugin.http.setCookie('http://httpbin.org/get', 'mySecondCookie=mySecondValue');

      cordova.plugin.http.downloadFile(sourceUrl, {}, {}, targetPath, function(entry) {
        helpers.getWithXhr(function(content) {
          resolve({
            sourceUrl: sourceUrl,
            targetPath: targetPath,
            fullPath: entry.fullPath,
            name: entry.name,
            content: content
          });
        }, targetPath);
      }, reject);
    },
    validationFunc: function(driver, result) {
      result.type.should.be.equal('resolved');
      result.data.name.should.be.equal('cookies.json');
      result.data.content.should.be.a('string');

      var cookies = JSON.parse(result.data.content).cookies;

      cookies.myCookie.should.be.equal('myValue');
      cookies.mySecondCookie.should.be.equal('mySecondValue');
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { tests: tests, hooks: hooks };
}
