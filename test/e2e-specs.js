const hooks = {
  onBeforeEachTest: function (resolve, reject) {
    cordova.plugin.http.clearCookies();

    helpers.enableFollowingRedirect(function() {
      // server trust mode is not supported on brpwser platform
      if (cordova.platformId === 'browser') {
        return resolve();
      }

      helpers.setDefaultServerTrustMode(function () {
        // @TODO: not ready yet
        // helpers.setNoneClientAuthMode(resolve, reject);
        resolve();
      }, reject);
    });
  }
};

const helpers = {
  setDefaultServerTrustMode: function (resolve, reject) { cordova.plugin.http.setServerTrustMode('default', resolve, reject); },
  setNoCheckServerTrustMode: function (resolve, reject) { cordova.plugin.http.setServerTrustMode('nocheck', resolve, reject); },
  setPinnedServerTrustMode: function (resolve, reject) { cordova.plugin.http.setServerTrustMode('pinned', resolve, reject); },
  setNoneClientAuthMode: function (resolve, reject) { cordova.plugin.http.setClientAuthMode('none', resolve, reject); },
  setBufferClientAuthMode: function (resolve, reject) {
    helpers.getWithXhr(function(pkcs) {
      cordova.plugin.http.setClientAuthMode('buffer', {
        rawPkcs: pkcs,
        pkcsPassword: 'badssl.com'
      }, resolve, reject);
    }, './certificates/badssl-client-cert.pkcs', 'arraybuffer');
  },
  setJsonSerializer: function (resolve) { resolve(cordova.plugin.http.setDataSerializer('json')); },
  setUtf8StringSerializer: function (resolve) { resolve(cordova.plugin.http.setDataSerializer('utf8')); },
  setUrlEncodedSerializer: function (resolve) { resolve(cordova.plugin.http.setDataSerializer('urlencoded')); },
  disableFollowingRedirect: function (resolve) { resolve(cordova.plugin.http.setFollowRedirect(false)); },
  enableFollowingRedirect: function(resolve) { resolve(cordova.plugin.http.setFollowRedirect(true)); },
  getWithXhr: function (done, url, type) {
    var xhr = new XMLHttpRequest();

    xhr.addEventListener('load', function () {
      if (!type || type === 'text') {
        done(this.responseText);
      } else {
        done(this.response);
      }
    });

    xhr.responseType = type;
    xhr.open('GET', url);
    xhr.send();
  },
  writeToFile: function (done, fileName, content) {
    window.resolveLocalFileSystemURL(cordova.file.cacheDirectory, function (directoryEntry) {
      directoryEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
          var blob = new Blob([content], { type: 'text/plain' });

          fileWriter.onwriteend = done;
          fileWriter.onerror = done;
          fileWriter.write(blob);
        }, done);
      }, done);
    }, done);
  },
  // adopted from: https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  hashArrayBuffer: function (buffer) {
    var hash = 0;
    var byteArray = new Uint8Array(buffer);

    for (var i = 0; i < byteArray.length; i++) {
      hash  = ((hash << 5) - hash) + byteArray[i];
      hash |= 0; // Convert to 32bit integer
    }

    return hash;
  }
};

const messageFactory = {
  sslTrustAnchor: function () { return 'TLS connection could not be established: javax.net.ssl.SSLHandshakeException: java.security.cert.CertPathValidatorException: Trust anchor for certification path not found.' },
  invalidCertificate: function (domain) { return 'The certificate for this server is invalid. You might be connecting to a server that is pretending to be “' + domain + '” which could put your confidential information at risk.' }
}

const tests = [
  {
    description: 'should reject self signed cert (GET)',
    expected: 'rejected: {"status":-2, ...',
    func: function (resolve, reject) { cordova.plugin.http.get('https://self-signed.badssl.com/', {}, {}, resolve, reject); },
    validationFunc: function (driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -2, error: targetInfo.isAndroid ? messageFactory.sslTrustAnchor() : messageFactory.invalidCertificate('self-signed.badssl.com') });
    }
  },
  {
    description: 'should reject self signed cert (PUT)',
    expected: 'rejected: {"status":-2, ...',
    func: function (resolve, reject) { cordova.plugin.http.put('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -2, error: targetInfo.isAndroid ? messageFactory.sslTrustAnchor() : messageFactory.invalidCertificate('self-signed.badssl.com') });
    }
  },
  {
    description: 'should reject self signed cert (POST)',
    expected: 'rejected: {"status":-2, ...',
    func: function (resolve, reject) { cordova.plugin.http.post('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -2, error: targetInfo.isAndroid ? messageFactory.sslTrustAnchor() : messageFactory.invalidCertificate('self-signed.badssl.com') });
    }
  },
  {
    description: 'should reject self signed cert (PATCH)',
    expected: 'rejected: {"status":-2, ...',
    func: function (resolve, reject) { cordova.plugin.http.patch('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -2, error: targetInfo.isAndroid ? messageFactory.sslTrustAnchor() : messageFactory.invalidCertificate('self-signed.badssl.com') });
    }
  },
  {
    description: 'should reject self signed cert (DELETE)',
    expected: 'rejected: {"status":-2, ...',
    func: function (resolve, reject) { cordova.plugin.http.delete('https://self-signed.badssl.com/', {}, {}, resolve, reject); },
    validationFunc: function (driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -2, error: targetInfo.isAndroid ? messageFactory.sslTrustAnchor() : messageFactory.invalidCertificate('self-signed.badssl.com') });
    }
  },
  {
    description: 'should accept bad cert (GET)',
    expected: 'resolved: {"status":200, ...',
    before: helpers.setNoCheckServerTrustMode,
    func: function (resolve, reject) { cordova.plugin.http.get('https://self-signed.badssl.com/', {}, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.should.include({ status: 200 });
    }
  },
  {
    description: 'should accept bad cert (PUT)',
    expected: 'rejected: {"status":405, ... // will be rejected because PUT is not allowed',
    before: helpers.setNoCheckServerTrustMode,
    func: function (resolve, reject) { cordova.plugin.http.put('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('rejected');
      result.data.should.include({ status: 405 });
    }
  },
  {
    description: 'should accept bad cert (POST)',
    expected: 'rejected: {"status":405, ... // will be rejected because POST is not allowed',
    before: helpers.setNoCheckServerTrustMode,
    func: function (resolve, reject) { cordova.plugin.http.post('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('rejected');
      result.data.should.include({ status: 405 });
    }
  },
  {
    description: 'should accept bad cert (PATCH)',
    expected: 'rejected: {"status":405, ... // will be rejected because PATCH is not allowed',
    before: helpers.setNoCheckServerTrustMode,
    func: function (resolve, reject) { cordova.plugin.http.patch('https://self-signed.badssl.com/', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('rejected');
      result.data.should.include({ status: 405 });
    }
  },
  {
    description: 'should accept bad cert (DELETE)',
    expected: 'rejected: {"status":405, ... // will be rejected because DELETE is not allowed',
    before: helpers.setNoCheckServerTrustMode,
    func: function (resolve, reject) { cordova.plugin.http.delete('https://self-signed.badssl.com/', {}, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('rejected');
      result.data.should.include({ status: 405 });
    }
  },
  {
    description: 'should fetch data from http://httpbin.org/ (GET)',
    expected: 'resolved: {"status":200, ...',
    before: helpers.setNoCheckServerTrustMode,
    func: function (resolve, reject) { cordova.plugin.http.get('http://httpbin.org/', {}, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.should.include({ status: 200 });
    }
  },
  {
    description: 'should send JSON object correctly (POST)',
    expected: 'resolved: {"status": 200, "data": "{\\"json\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setJsonSerializer,
    func: function (resolve, reject) { cordova.plugin.http.post('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql({ test: 'testString' });
    }
  },
  {
    description: 'should send JSON object correctly (PUT)',
    expected: 'resolved: {"status": 200, "data": "{\\"json\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setJsonSerializer,
    func: function (resolve, reject) { cordova.plugin.http.put('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql({ test: 'testString' });
    }
  },
  {
    description: 'should send JSON object correctly (PATCH)',
    expected: 'resolved: {"status": 200, "data": "{\\"json\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setJsonSerializer,
    func: function (resolve, reject) { cordova.plugin.http.patch('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql({ test: 'testString' });
    }
  },
  {
    description: 'should send JSON array correctly (POST) #26',
    expected: 'resolved: {"status": 200, "data": "[ 1, 2, 3 ]\" ...',
    before: helpers.setJsonSerializer,
    func: function (resolve, reject) { cordova.plugin.http.post('http://httpbin.org/anything', [1, 2, 3], {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql([1, 2, 3]);
    }
  },
  {
    description: 'should send JSON array correctly (PUT) #26',
    expected: 'resolved: {"status": 200, "data": "[ 1, 2, 3 ]\" ...',
    before: helpers.setJsonSerializer,
    func: function (resolve, reject) { cordova.plugin.http.put('http://httpbin.org/anything', [1, 2, 3], {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql([1, 2, 3]);
    }
  },
  {
    description: 'should send JSON array correctly (PATCH) #26',
    expected: 'resolved: {"status": 200, "data": "[ 1, 2, 3 ]\" ...',
    before: helpers.setJsonSerializer,
    func: function (resolve, reject) { cordova.plugin.http.patch('http://httpbin.org/anything', [1, 2, 3], {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.data.should.be.a('string');
      JSON.parse(result.data.data).json.should.eql([1, 2, 3]);
    }
  },
  {
    description: 'should send url encoded data correctly (POST) #41',
    expected: 'resolved: {"status": 200, "data": "{\\"form\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setUrlEncodedSerializer,
    func: function (resolve, reject) { cordova.plugin.http.post('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).form.should.eql({ test: 'testString' });
    }
  },
  {
    description: 'should send url encoded data correctly (PUT)',
    expected: 'resolved: {"status": 200, "data": "{\\"form\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setUrlEncodedSerializer,
    func: function (resolve, reject) { cordova.plugin.http.put('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).form.should.eql({ test: 'testString' });
    }
  },
  {
    description: 'should send url encoded data correctly (PATCH)',
    expected: 'resolved: {"status": 200, "data": "{\\"form\\":\\"test\\": \\"testString\\"}\" ...',
    before: helpers.setUrlEncodedSerializer,
    func: function (resolve, reject) { cordova.plugin.http.patch('http://httpbin.org/anything', { test: 'testString' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).form.should.eql({ test: 'testString' });
    }
  },
  {
    description: 'should resolve correct URL after redirect (GET) #33',
    expected: 'resolved: {"status": 200, url: "http://httpbin.org/anything", ...',
    func: function (resolve, reject) { cordova.plugin.http.get('http://httpbin.org/redirect-to?url=http://httpbin.org/anything', {}, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.url.should.be.equal('http://httpbin.org/anything');
    }
  },
  {
    description: 'should not follow 302 redirect when following redirects is disabled',
    expected: 'rejected: {"status": 302, ...',
    before: function(resolve, reject) { cordova.plugin.http.disableRedirect(true, resolve, reject)},
    func: function (resolve, reject) { cordova.plugin.http.get('http://httpbin.org/redirect-to?url=http://httpbin.org/anything', {}, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('rejected');
      result.data.status.should.be.equal(302);
    }
  },
  {
    description: 'should download a file from given URL to given path in local filesystem',
    expected: 'resolved: {"content": "<?xml version=\'1.0\' encoding=\'us-ascii\'?>\\n\\n<!--  A SAMPLE set of slides  -->" ...',
    func: function (resolve, reject) {
      var sourceUrl = 'http://httpbin.org/xml';
      var targetPath = cordova.file.cacheDirectory + 'test.xml';

      cordova.plugin.http.downloadFile(sourceUrl, {}, {}, targetPath, function (entry) {
        helpers.getWithXhr(function (content) {
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
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.name.should.be.equal('test.xml');
      result.data.content.should.be.equal("<?xml version='1.0' encoding='us-ascii'?>\n\n<!--  A SAMPLE set of slides  -->\n\n<slideshow \n    title=\"Sample Slide Show\"\n    date=\"Date of publication\"\n    author=\"Yours Truly\"\n    >\n\n    <!-- TITLE SLIDE -->\n    <slide type=\"all\">\n      <title>Wake up to WonderWidgets!</title>\n    </slide>\n\n    <!-- OVERVIEW -->\n    <slide type=\"all\">\n        <title>Overview</title>\n        <item>Why <em>WonderWidgets</em> are great</item>\n        <item/>\n        <item>Who <em>buys</em> WonderWidgets</item>\n    </slide>\n\n</slideshow>");
    }
  },
  {
    description: 'should upload a file from given path in local filesystem to given URL #27',
    expected: 'resolved: {"status": 200, "data": "files": {"test-file.txt": "I am a dummy file. I am used ...',
    func: function (resolve, reject) {
      var fileName = 'test-file.txt';
      var fileContent = 'I am a dummy file. I am used for testing purposes!';
      var sourcePath = cordova.file.cacheDirectory + fileName;
      var targetUrl = 'http://httpbin.org/post';

      helpers.writeToFile(function () {
        cordova.plugin.http.uploadFile(targetUrl, {}, {}, sourcePath, fileName, resolve, reject);
      }, fileName, fileContent);
    },
    validationFunc: function (driver, result) {
      var fileName = 'test-file.txt';
      var fileContent = 'I am a dummy file. I am used for testing purposes!';

      result.type.should.be.equal('resolved');
      result.data.data.should.be.a('string');

      JSON
        .parse(result.data.data)
        .files[fileName]
        .should.be.equal(fileContent);
    }
  },
  {
    description: 'should encode HTTP array params correctly (GET) #45',
    expected: 'resolved: {"status": 200, "data": "{\\"url\\":\\"http://httpbin.org/get?myArray[]=val1&myArray[]=val2&myArray[]=val3\\"}\" ...',
    func: function (resolve, reject) {
      cordova.plugin.http.get('http://httpbin.org/get', { myArray: ['val1', 'val2', 'val3'], myString: 'testString' }, {}, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.data.should.be.a('string');

      JSON
        .parse(result.data.data)
        .url
        .should.include('httpbin.org/get?myArray[]=val1&myArray[]=val2&myArray[]=val3&myString=testString');
    }
  },
  {
    description: 'should throw on non-string values in local header object #54',
    expected: 'throwed: {"message": "advanced-http: header values must be strings"}',
    func: function (resolve, reject) {
      cordova.plugin.http.get('http://httpbin.org/get', {}, { myTestHeader: 1 }, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('throwed');
      result.message.should.be.equal('advanced-http: header values must be strings');
    }
  },
  {
    description: 'should throw an error while setting non-string value as global header #54',
    expected: 'throwed: "advanced-http: header values must be strings"',
    func: function (resolve, reject) {
      cordova.plugin.http.setHeader('myTestHeader', 2);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('throwed');
      result.message.should.be.equal('advanced-http: header values must be strings');
    }
  },
  {
    description: 'should accept content-type "application/xml" #58',
    expected: 'resolved: {"status": 200, ...',
    func: function (resolve, reject) {
      cordova.plugin.http.get('http://httpbin.org/xml', {}, {}, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.status.should.be.equal(200);
    }
  },
  {
    description: 'should send programmatically set cookies correctly (GET)',
    expected: 'resolved: {"status": 200, ...',
    func: function (resolve, reject) {
      cordova.plugin.http.setCookie('http://httpbin.org/get', 'myCookie=myValue');
      cordova.plugin.http.setCookie('http://httpbin.org/get', 'mySecondCookie=mySecondValue');
      cordova.plugin.http.get('http://httpbin.org/get', {}, {}, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.data.should.be.a('string');

      JSON
        .parse(result.data.data)
        .headers
        .Cookie
        .should.be.equal('myCookie=myValue; mySecondCookie=mySecondValue');
    }
  },
  {
    description: 'should not send any cookies after running "clearCookies" (GET) #59',
    expected: 'resolved: {"status": 200, "data": "{\"headers\": {\"Cookie\": \"\"...',
    func: function (resolve, reject) {
      cordova.plugin.http.setCookie('http://httpbin.org/get', 'myCookie=myValue');
      cordova.plugin.http.setCookie('http://httpbin.org/get', 'mySecondCookie=mySecondValue');
      cordova.plugin.http.clearCookies();
      cordova.plugin.http.get('http://httpbin.org/get', {}, {}, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.data.should.be.a('string');

      JSON
        .parse(result.data.data)
        .headers
        .should.not.have.property('Cookie');
    }
  },
  {
    description: 'should send programmatically set cookies correctly (DOWNLOAD) #57',
    expected: 'resolved: {"content":{"cookies":{"myCookie":"myValue ...',
    func: function (resolve, reject) {
      var sourceUrl = 'http://httpbin.org/cookies';
      var targetPath = cordova.file.cacheDirectory + 'cookies.json';

      cordova.plugin.http.setCookie('http://httpbin.org/get', 'myCookie=myValue');
      cordova.plugin.http.setCookie('http://httpbin.org/get', 'mySecondCookie=mySecondValue');

      cordova.plugin.http.downloadFile(sourceUrl, {}, {}, targetPath, function (entry) {
        helpers.getWithXhr(function (content) {
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
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.name.should.be.equal('cookies.json');
      result.data.content.should.be.a('string');

      var cookies = JSON.parse(result.data.content).cookies;

      cookies.myCookie.should.be.equal('myValue');
      cookies.mySecondCookie.should.be.equal('mySecondValue');
    }
  },
  {
    description: 'should send UTF-8 encoded raw string correctly (POST) #34',
    expected: 'resolved: {"status": 200, "data": "{\\"data\\": \\"this is a test string\\"...',
    before: helpers.setUtf8StringSerializer,
    func: function (resolve, reject) {
      cordova.plugin.http.post('http://httpbin.org/anything', 'this is a test string', {}, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).data.should.be.equal('this is a test string');
    }
  },
  {
    description: 'should encode spaces in query string (params object) correctly (GET) #71',
    expected: 'resolved: {"status": 200, "data": "{\\"args\\": \\"query param\\": \\"and value with spaces\\"...',
    func: function (resolve, reject) {
      cordova.plugin.http.get('http://httpbin.org/get', { 'query param': 'and value with spaces' }, {}, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).args['query param'].should.be.equal('and value with spaces');
    }
  },
  {
    description: 'should decode latin1 (iso-8859-1) encoded body correctly (GET) #72',
    expected: 'resolved: {"status": 200, "data": "<!DOCTYPE HTML PUBLIC \\"-//W3C//DTD HTML 4.01 Transitional//EN\\"> ...',
    func: function (resolve, reject) {
      cordova.plugin.http.get('http://www.columbia.edu/kermit/latin1.html', {}, {}, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.data.should.include('[¡]  161  10/01  241  A1  INVERTED EXCLAMATION MARK\n[¢]  162  10/02  242  A2  CENT SIGN');
    }
  },
  {
    description: 'should return empty body string correctly (GET)',
    expected: 'resolved: {"status": 200, "data": "" ...',
    func: function (resolve, reject) {
      cordova.plugin.http.get('http://httpbin.org/stream/0', {}, {}, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.data.should.be.equal('');
    }
  },
  {
    description: 'should pin SSL cert correctly (GET)',
    expected: 'resolved: {"status": 200 ...',
    before: helpers.setPinnedServerTrustMode,
    func: function (resolve, reject) {
      cordova.plugin.http.get('https://httpbin.org', {}, {}, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.status.should.be.equal(200);
    }
  },
  {
    description: 'should reject when pinned cert does not match received server cert (GET)',
    expected: 'rejected: {"status": -2 ...',
    before: helpers.setPinnedServerTrustMode,
    func: function (resolve, reject) {
      cordova.plugin.http.get('https://sha512.badssl.com/', {}, {}, resolve, reject);
    },
    validationFunc: function (driver, result, targetInfo) {
      result.type.should.be.equal('rejected');
      result.data.should.be.eql({ status: -2, error: targetInfo.isAndroid ? messageFactory.sslTrustAnchor() : messageFactory.invalidCertificate('sha512.badssl.com') });
    }
  },
  {
    description: 'should send deeply structured JSON object correctly (POST) #65',
    expected: 'resolved: {"status": 200, "data": "{\\"data\\": \\"{\\\\"outerObj\\\\":{\\\\"innerStr\\\\":\\\\"testString\\\\",\\\\"innerArr\\\\":[1,2,3]}}\\" ...',
    before: helpers.setJsonSerializer,
    func: function (resolve, reject) { cordova.plugin.http.post('http://httpbin.org/anything', { outerObj: { innerStr: 'testString', innerArr: [1, 2, 3] } }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.should.eql({ outerObj: { innerStr: 'testString', innerArr: [1, 2, 3] } });
    }
  },
  {
    description: 'should override header "content-type" correctly (POST) #78',
    expected: 'resolved: {"status": 200, "headers": "{\\"Content-Type\\": \\"text/plain\\" ...',
    before: helpers.setJsonSerializer,
    func: function (resolve, reject) { cordova.plugin.http.post('http://httpbin.org/anything', {}, { 'Content-Type': 'text/plain' }, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).headers['Content-Type'].should.be.equal('text/plain');
    }
  },
  {
    description: 'should handle error during file download correctly (DOWNLOAD) #83',
    expected: 'rejected: {"status": 403, "error": "There was an error downloading the file" ...',
    func: function (resolve, reject) { cordova.plugin.http.downloadFile('http://httpbin.org/status/403', {}, {}, cordova.file.tempDirectory + 'testfile.txt', resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('rejected');
      result.data.status.should.be.equal(403);
      result.data.error.should.be.equal('There was an error downloading the file');
    }
  },
  {
    description: 'should handle gzip encoded response correctly',
    expected: 'resolved: {"status": 200, "headers": "{\\"Content-Encoding\\": \\"gzip\\" ...',
    func: function (resolve, reject) { cordova.plugin.http.get('http://httpbin.org/gzip', {}, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.status.should.be.equal(200);
      JSON.parse(result.data.data).gzipped.should.be.equal(true);
    }
  },
  {
    description: 'should send empty string correctly',
    expected: 'resolved: {"status": 200, "data": "{\\"json\\":\\"\\" ...',
    before: helpers.setUtf8StringSerializer,
    func: function (resolve, reject) { cordova.plugin.http.post('http://httpbin.org/anything', '', {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).data.should.be.equal('');
    }
  },
  {
    description: 'shouldn\'t escape forward slashes #184',
    expected: 'resolved: {"status": 200, "data": "{\\"json\\":\\"/\\" ...',
    before: helpers.setJsonSerializer,
    func: function (resolve, reject) { cordova.plugin.http.post('http://httpbin.org/anything', { testString: '/' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).json.testString.should.be.equal('/');
    }
  },
  {
    description: 'should not double encode spaces in url path #195',
    expected: 'resolved: {"status": 200, "data": "{\\"url\\":\\"https://httpbin.org/anything/containing spaces in url\\" ...',
    func: function (resolve, reject) { cordova.plugin.http.get('https://httpbin.org/anything/containing%20spaces%20in%20url', {}, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).url.should.be.equal('https://httpbin.org/anything/containing spaces in url');
    }
  },
  {
    description: 'should encode spaces in url query correctly',
    expected: 'resolved: {"status": 200, "data": "{\\"url\\":\\"https://httpbin.org/anything?query key=very long query value with spaces\\" ...',
    func: function (resolve, reject) { cordova.plugin.http.get('https://httpbin.org/anything', { 'query key': 'very long query value with spaces' }, {}, resolve, reject); },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      JSON.parse(result.data.data).url.should.be.equal('https://httpbin.org/anything?query key=very long query value with spaces');
    }
  },
  {
    description: 'should download a file from given HTTPS URL to given path in local filesystem #197',
    expected: 'resolved: {"content": "<?xml version=\'1.0\' encoding=\'us-ascii\'?>\\n\\n<!--  A SAMPLE set of slides  -->" ...',
    func: function (resolve, reject) {
      var sourceUrl = 'https://httpbin.org/xml';
      var targetPath = cordova.file.cacheDirectory + 'test.xml';

      cordova.plugin.http.downloadFile(sourceUrl, {}, {}, targetPath, function (entry) {
        helpers.getWithXhr(function (content) {
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
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.name.should.be.equal('test.xml');
      result.data.content.should.be.equal("<?xml version='1.0' encoding='us-ascii'?>\n\n<!--  A SAMPLE set of slides  -->\n\n<slideshow \n    title=\"Sample Slide Show\"\n    date=\"Date of publication\"\n    author=\"Yours Truly\"\n    >\n\n    <!-- TITLE SLIDE -->\n    <slide type=\"all\">\n      <title>Wake up to WonderWidgets!</title>\n    </slide>\n\n    <!-- OVERVIEW -->\n    <slide type=\"all\">\n        <title>Overview</title>\n        <item>Why <em>WonderWidgets</em> are great</item>\n        <item/>\n        <item>Who <em>buys</em> WonderWidgets</item>\n    </slide>\n\n</slideshow>");
    }
  },
  {
    description: 'should fetch binary correctly when response type is "arraybuffer"',
    expected: 'resolved: {"hash":-1032603775,"byteLength":35588}',
    func: function (resolve, reject) {
      var url = 'https://httpbin.org/image/jpeg';
      var options = { method: 'get', responseType: 'arraybuffer' };
      var success = function (response) {
        resolve({
          hash: helpers.hashArrayBuffer(response.data),
          byteLength: response.data.byteLength
        });
      };
      cordova.plugin.http.sendRequest(url, options, success, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('resolved');
      result.data.hash.should.be.equal(-1032603775);
      result.data.byteLength.should.be.equal(35588);
    }
  },
  {
    description: 'should decode error body even if response type is "arraybuffer"',
    expected: 'rejected: {"status": 418, ...',
    func: function (resolve, reject) {
      var url = 'https://httpbin.org/status/418';
      var options = { method: 'get', responseType: 'arraybuffer' };
      cordova.plugin.http.sendRequest(url, options, resolve, reject);
    },
    validationFunc: function (driver, result) {
      result.type.should.be.equal('rejected');
      result.data.status.should.be.equal(418);
      result.data.error.should.be.equal("\n    -=[ teapot ]=-\n\n       _...._\n     .'  _ _ `.\n    | .\"` ^ `\". _,\n    \\_;`\"---\"`|//\n      |       ;/\n      \\_     _/\n        `\"\"\"`\n");
    }
  }
  // @TODO: not ready yet
  // {
  //   description: 'should authenticate correctly when client cert auth is configured with a PKCS12 container',
  //   expected: 'resolved: {"status": 200, ...',
  //   before: helpers.setBufferClientAuthMode,
  //   func: function (resolve, reject) { cordova.plugin.http.get('https://client.badssl.com/', {}, {}, resolve, reject); },
  //   validationFunc: function (driver, result) {
  //     result.type.should.be.equal('resolved');
  //     result.data.data.should.include('TLS handshake');
  //   }
  // }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { tests: tests, hooks: hooks };
}
