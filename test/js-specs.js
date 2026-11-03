const chai = require('chai');
const util = require('util');
const should = chai.should();

const BlobMock = require('./mocks/Blob.mock');
const ConsoleMock = require('./mocks/Console.mock');
const FileMock = require('./mocks/File.mock');
const FileReaderMock = require('./mocks/FileReader.mock');
const FormDataMock = require('./mocks/FormData.mock');

describe('Advanced HTTP public interface', function () {
  const messages = require('../www/messages');

  let http = {};

  const noop = () => { /* intentionally doing nothing */ };

  const getDependenciesBlueprint = () => {
    const globalConfigs = require('../www/global-configs');
    const jsUtil = require('../www/js-util');
    const ToughCookie = require('../www/umd-tough-cookie');
    const lodash = require('../www/lodash');
    const errorCodes = require('../www/error-codes');
    const WebStorageCookieStore = require('../www/local-storage-store')(ToughCookie, lodash);
    const cookieHandler = require('../www/cookie-handler')(null, ToughCookie, WebStorageCookieStore);
    const helpers = require('../www/helpers')(null, jsUtil, cookieHandler, messages, errorCodes);
    const urlUtil = require('../www/url-util')(jsUtil);

    return { exec: noop, cookieHandler, urlUtil: urlUtil, helpers, globalConfigs, errorCodes };
  };

  const loadHttp = (deps) => {
    http = require('../www/public-interface')(deps.exec, deps.cookieHandler, deps.urlUtil, deps.helpers, deps.globalConfigs, deps.errorCodes);
  };

  beforeEach(() => {
    // mocked btoa function (base 64 encoding strings)
    global.btoa = decoded => Buffer.from(decoded).toString('base64');
    loadHttp(getDependenciesBlueprint());
  });

  it('sets global headers correctly with two args (old interface)', () => {
    http.setHeader('myKey', 'myValue');
    http.getHeaders('*').myKey.should.equal('myValue');
  });

  it('sets global headers correctly with three args (new interface) #24', () => {
    http.setHeader('*', 'myKey', 'myValue');
    http.getHeaders('*').myKey.should.equal('myValue');
  });

  it('clears global headers correctly when value is undefined', () => {
    http.setHeader('*', 'myKey', 'myValue');
    http.setHeader('*', 'myKey', null);
    should.equal(undefined, http.getHeaders('*').myKey);
    Object.keys(http.getHeaders('*')).length.should.be.equal(0);
  });

  it('sets host headers correctly #24', () => {
    http.setHeader('www.google.de', 'myKey', 'myValue');
    http.getHeaders('www.google.de').myKey.should.equal('myValue');
  });

  it('resolves global headers correctly #24', () => {
    const deps = getDependenciesBlueprint();

    deps.cookieHandler.getCookieString = () => 'fakeCookieString';

    deps.exec = (onSuccess, onFail, namespace, method, params) => {
      const headers = params[1];
      headers.should.eql({
        Cookie: 'fakeCookieString',
        myKey: 'myValue'
      });
    };

    loadHttp(deps);

    http.setHeader('*', 'myKey', 'myValue');
    http.get('url', {}, {}, noop, noop);
  });

  it('resolves host headers correctly (set without port number) #37', () => {
    const deps = getDependenciesBlueprint();

    deps.cookieHandler.getCookieString = () => 'fakeCookieString';

    deps.exec = (onSuccess, onFail, namespace, method, params) => {
      const headers = params[1];
      headers.should.eql({
        Cookie: 'fakeCookieString',
        myKey: 'myValue'
      });
    };

    loadHttp(deps);

    http.setHeader('www.google.de', 'myKey', 'myValue');
    http.get('https://www.google.de/?gws_rd=ssl', {}, {}, noop, noop);
  });

  it('resolves host headers correctly (set with port number) #37', () => {
    const deps = getDependenciesBlueprint();

    deps.cookieHandler.getCookieString = () => 'fakeCookieString';

    deps.exec = (onSuccess, onFail, namespace, method, params) => {
      const headers = params[1];
      headers.should.eql({
        Cookie: 'fakeCookieString',
        myKey: 'myValue'
      });
    };

    loadHttp(deps);

    http.setHeader('www.google.de:8080', 'myKey', 'myValue');
    http.get('https://www.google.de:8080/?gws_rd=ssl', {}, {}, noop, noop);
  });

  it('resolves request headers correctly', () => {
    const deps = getDependenciesBlueprint();

    deps.cookieHandler.getCookieString = () => 'fakeCookieString';

    deps.exec = (onSuccess, onFail, namespace, method, params) => {
      const headers = params[1];
      headers.should.eql({
        Cookie: 'fakeCookieString',
        myKey: 'myValue'
      });
    };

    loadHttp(deps);

    http.get('https://www.google.de/?gws_rd=ssl', {}, { myKey: 'myValue' }, noop, noop);
  });

  it('sets basic authentication header correctly #36', () => {
    http.useBasicAuth('name', 'pass');
    http.getHeaders('*').Authorization.should.equal('Basic bmFtZTpwYXNz');
  });

  it('throws an Error when you try to add a cookie by using "setHeader" #46', () => {
    (() => { http.setHeader('*', 'cookie', 'value'); }).should.throw(messages.ADDING_COOKIES_NOT_SUPPORTED);
  });

  it('configures global timeout value correctly with given valid value', () => {
    http.setRequestTimeout(10);
    http.getRequestTimeout().should.equal(10);
    http.getConnectTimeout().should.equal(10);
    http.getReadTimeout().should.equal(10);
  });

  it('throws an Error when you try to configure global timeout with a string', () => {
    (() => { http.setRequestTimeout('myString'); }).should.throw(messages.INVALID_TIMEOUT_VALUE);
  });

  it('configures connect timeout value correctly with given valid value', () => {
    http.setConnectTimeout(10);
    http.getConnectTimeout().should.equal(10);
  })

  it('throws an Error when you try to configure connect timeout with a string', () => {
    (() => { http.setConnectTimeout('myString'); }).should.throw(messages.INVALID_TIMEOUT_VALUE);
  })

  it('configures read timeout value correctly with given valid value', () => {
    http.setReadTimeout(10);
    http.getReadTimeout().should.equal(10);
  })

  it('throws an Error when you try to configure connect timeout with a string', () => {
    (() => { http.setReadTimeout('myString'); }).should.throw(messages.INVALID_TIMEOUT_VALUE);
  })

  it('sets global option for following redirects correctly', () => {
    http.setFollowRedirect(false);
    http.getFollowRedirect().should.equal(false);
  });

  it('throws an Error when you try to configure global option for following redirects with a string', () => {
    (() => { http.setFollowRedirect('myString'); }).should.throw(messages.INVALID_FOLLOW_REDIRECT_VALUE);
  });

  it('exposes an enumeration style object with mappings for the error codes', () => {
    Object.keys(http.ErrorCode).forEach(key => http.ErrorCode[key].should.be.a('number'));
  });
});

describe('Redirect handling', function () {
  const messages = require('../www/messages');
  const errorCodes = require('../www/error-codes');

  const noop = () => { /* intentionally doing nothing */ };

  const createStorage = () => {
    const items = {};

    return {
      getItem: key => (Object.prototype.hasOwnProperty.call(items, key) ? items[key] : null),
      setItem: (key, value) => { items[key] = String(value); },
      removeItem: key => { delete items[key]; }
    };
  };

  // routes maps a URL to the response the fake server gives; every native call is recorded
  const loadHttp = (routes, settings) => {
    settings = settings || {};
    const jsUtil = require('../www/js-util');
    const ToughCookie = require('../www/umd-tough-cookie');
    const lodash = require('../www/lodash');
    const WebStorageCookieStore = require('../www/local-storage-store')(ToughCookie, lodash);
    const cookieHandler = require('../www/cookie-handler')(createStorage(), ToughCookie, WebStorageCookieStore);
    const helpers = require('../www/helpers')(null, jsUtil, cookieHandler, messages, null, errorCodes, null, null);
    const urlUtil = require('../www/url-util')(jsUtil);

    Object.assign(helpers, settings.helpers || {});

    // a fresh config: other specs change the shared global-configs module
    const globalConfigs = { headers: {}, serializer: 'urlencoded', followRedirect: true, timeout: 60.0, connectTimeout: 60.0, readTimeout: 60.0 };
    const calls = [];

    const exec = (onSuccess, onFail, namespace, method, params) => {
      const isBodyMethod = ['post', 'put', 'patch'].indexOf(method) !== -1;
      const call = {
        method,
        url: params[0],
        data: isBodyMethod ? params[1] : undefined,
        headers: isBodyMethod ? params[3] : params[1],
        followRedirect: method === 'downloadFile' ? params[5] : params[isBodyMethod ? 6 : method === 'uploadFiles' ? 6 : 4]
      };
      const route = routes[call.url] || { status: 404 };
      const response = { status: route.status, url: call.url, headers: route.headers || {} };

      calls.push(call);

      const respond = () => (response.status >= 200 && response.status < 300 ? onSuccess(response) : onFail(response));

      if (route.onCall) {
        route.onCall();
      }

      // native answers asynchronously; routes opt in where the timing matters
      return route.async ? setImmediate(respond) : respond();
    };

    const http = require('../www/public-interface')(exec, cookieHandler, urlUtil, helpers, globalConfigs, errorCodes, null, settings.nativeFollowsRedirects);

    return { http, calls };
  };

  const redirect = (status, location, headers) => ({ status, headers: Object.assign({ location }, headers || {}) });

  it('never asks native to follow redirects', () => {
    const { http, calls } = loadHttp({ 'https://a.example/start': { status: 200 } });

    http.get('https://a.example/start', {}, {}, noop, noop);
    calls[0].followRedirect.should.equal(false);
  });

  it('does not send credentials or cookies to another origin', () => {
    const { http, calls } = loadHttp({
      'https://a.example/start': redirect(302, 'https://b.example/land'),
      'https://b.example/land': { status: 200 }
    });

    http.useBasicAuth('user', 'secret');
    http.setCookie('https://a.example/', 'session=A_SECRET');
    http.get('https://a.example/start', {}, { 'Proxy-Authorization': 'p' }, noop, noop);

    calls[0].headers.should.include.keys('Authorization', 'Cookie', 'Proxy-Authorization');
    calls[1].url.should.equal('https://b.example/land');
    calls[1].headers.should.not.have.any.keys('Authorization', 'Cookie', 'Proxy-Authorization');
  });

  it('keeps credentials dropped after the chain returns to the original origin', () => {
    const { http, calls } = loadHttp({
      'https://a.example/start': redirect(302, 'https://b.example/hop'),
      'https://b.example/hop': redirect(302, 'https://a.example/end'),
      'https://a.example/end': { status: 200 }
    });

    http.get('https://a.example/start', {}, { Authorization: 'Bearer token' }, noop, noop);
    calls[2].url.should.equal('https://a.example/end');
    calls[2].headers.should.not.have.key('Authorization');
  });

  it('does not send credentials configured for the target host on a cross-origin hop', () => {
    const { http, calls } = loadHttp({
      'http://a.example/start': redirect(302, 'http://b.example/land'),
      'http://b.example/land': { status: 200 }
    });

    http.setHeader('b.example', 'Authorization', 'Bearer for-b');
    http.setHeader('b.example', 'X-Client', 'app');
    http.get('http://a.example/start', {}, {}, noop, noop);
    calls[1].headers.should.not.have.key('Authorization');
    calls[1].headers['X-Client'].should.equal('app');
  });

  it('matches host headers set with an explicit default port after a redirect', () => {
    const { http, calls } = loadHttp({
      'https://api.example:443/start': redirect(302, '/next'),
      'https://api.example/next': { status: 200 }
    });

    http.setHeader('api.example:443', 'Authorization', 'Bearer token');
    http.get('https://api.example:443/start', {}, {}, noop, noop);
    calls[1].url.should.equal('https://api.example/next');
    calls[1].headers.Authorization.should.equal('Bearer token');
  });

  it('keeps credentials and sends cookies set on a same origin redirect', () => {
    const { http, calls } = loadHttp({
      'https://a.example/login': redirect(302, '/home', { 'set-cookie': 'sid=NEW; Path=/' }),
      'https://a.example/home': { status: 200 }
    });

    http.get('https://a.example/login', {}, { Authorization: 'Bearer token' }, noop, noop);
    calls[1].headers.Authorization.should.equal('Bearer token');
    calls[1].headers.Cookie.should.equal('sid=NEW');
  });

  it('replaces a cookie rotated by a redirect instead of sending both values', () => {
    const { http, calls } = loadHttp({
      'https://a.example/login': redirect(302, '/home', { 'set-cookie': 'sid=NEW; Path=/' }),
      'https://a.example/home': { status: 200 }
    });

    http.setCookie('https://a.example/', 'sid=OLD; Path=/');
    http.get('https://a.example/login', {}, {}, noop, noop);
    calls[1].headers.Cookie.should.equal('sid=NEW');
  });

  it('stores cookies from a redirect under the host that set them', () => {
    const { http, calls } = loadHttp({
      'https://a.example/start': redirect(302, 'https://b.example/land', { 'set-cookie': 'fromA=1; Path=/' }),
      'https://b.example/land': redirect(302, 'https://a.example/end', { 'set-cookie': 'fromB=1; Path=/' }),
      'https://a.example/end': { status: 200 }
    });

    http.get('https://a.example/start', {}, {}, noop, noop);
    calls[1].headers.should.not.have.key('Cookie');
    calls[2].headers.Cookie.should.equal('fromA=1');
    http.getCookieString('https://b.example/').should.equal('fromB=1');
  });

  it('rejects cookies a redirect sets for a domain it does not own', () => {
    const { http, calls } = loadHttp({
      'https://evil.example/start': redirect(302, 'https://bank.example/home', { 'set-cookie': 'sid=chosen; Domain=bank.example; Path=/' }),
      'https://bank.example/home': { status: 200 }
    });

    http.get('https://evil.example/start', {}, {}, noop, noop);
    calls[1].headers.should.not.have.key('Cookie');
  });

  it('honours cookie paths and deletions set on redirects', () => {
    const { http, calls } = loadHttp({
      'https://a.example/private/start': redirect(302, '/public', { 'set-cookie': 'sid=PRIVATE; Path=/private' }),
      'https://a.example/public': redirect(302, '/next', { 'set-cookie': 'old=1; Path=/; Max-Age=0' }),
      'https://a.example/next': { status: 200 }
    });

    http.setCookie('https://a.example/', 'old=1; Path=/');
    http.get('https://a.example/private/start', {}, {}, noop, noop);
    calls[1].headers.Cookie.should.equal('old=1');
    calls[2].headers.should.not.have.key('Cookie');
  });

  it('does not follow a redirect from https to http', () => {
    let failure = null;
    const { http, calls } = loadHttp({
      'https://a.example/start': redirect(302, 'http://a.example/plain')
    });

    http.get('https://a.example/start', {}, {}, noop, response => { failure = response; });
    calls.length.should.equal(1);
    failure.status.should.equal(302);
  });

  it('does not follow redirects when following is disabled', () => {
    let failure = null;
    const { http, calls } = loadHttp({
      'https://a.example/start': redirect(302, '/land'),
      'https://a.example/land': { status: 200 }
    });

    http.setFollowRedirect(false);
    http.get('https://a.example/start', {}, {}, noop, response => { failure = response; });
    calls.length.should.equal(1);
    failure.status.should.equal(302);
  });

  it('turns a 303 response to a POST into a GET without body headers', () => {
    const { http, calls } = loadHttp({
      'https://a.example/form': redirect(303, '/result'),
      'https://a.example/result': { status: 200 }
    });

    http.post('https://a.example/form', { x: 1 }, { 'Content-Type': 'application/json' }, noop, noop);
    calls[1].method.should.equal('get');
    calls[1].headers.should.not.have.key('Content-Type');
  });

  it('repeats method and body on 307 and keeps GET after an earlier rewrite', () => {
    const { http, calls } = loadHttp({
      'https://a.example/start': redirect(307, '/middle'),
      'https://a.example/middle': redirect(302, '/after'),
      'https://a.example/after': redirect(307, '/end'),
      'https://a.example/end': { status: 200 }
    });

    http.setDataSerializer('json');
    http.post('https://a.example/start', { x: 1 }, {}, noop, noop);
    calls.map(call => call.method).should.eql(['post', 'post', 'get', 'get']);
    calls[1].data.should.eql({ x: 1 });
    should.equal(undefined, calls[3].data);
  });

  it('keeps HEAD requests as HEAD across redirects', () => {
    const { http, calls } = loadHttp({
      'https://a.example/start': redirect(302, '/end'),
      'https://a.example/end': { status: 200 }
    });

    http.head('https://a.example/start', {}, {}, noop, noop);
    calls[1].method.should.equal('head');
  });

  it('stops after too many redirects', () => {
    let failure = null;
    const { http, calls } = loadHttp({ 'https://a.example/loop': redirect(302, '/loop') });

    http.get('https://a.example/loop', {}, {}, noop, response => { failure = response; });
    calls.length.should.equal(21);
    failure.status.should.equal(errorCodes.GENERIC);
  });

  it('stops following when the request is aborted between redirects', (done) => {
    const { http, calls } = loadHttp({
      'https://a.example/start': Object.assign(redirect(302, '/land'), { async: true }),
      'https://a.example/land': { status: 200 }
    });

    const reqId = http.get('https://a.example/start', {}, {}, noop, response => {
      calls.filter(call => call.method === 'get').length.should.equal(1);
      response.status.should.equal(errorCodes.ABORTED);
      done();
    });

    http.abort(reqId, noop, noop);
  });

  it('stops a 307 replay when aborted while the body is being serialized', (done) => {
    let reqId = null;
    const deferredProcessData = (data, serializer, cb) => setImmediate(() => cb(data));
    const routes = {
      'https://a.example/start': Object.assign(redirect(307, '/again'), { onCall: () => setImmediate(() => http.abort(reqId, noop, noop)) }),
      'https://a.example/again': { status: 200 }
    };
    const { http, calls } = loadHttp(routes, { helpers: { processData: deferredProcessData } });

    reqId = http.post('https://a.example/start', {}, {}, () => done(new Error('replay was sent')), response => {
      calls.filter(call => call.method === 'post').length.should.equal(1);
      response.status.should.equal(errorCodes.ABORTED);
      done();
    });
  });

  it('passes the file entry and the response to a download success callback', () => {
    let args = null;
    const fakeFileEntryHandler = cb => response => cb('fileEntry', response);
    const { http } = loadHttp({
      'https://a.example/file': redirect(302, '/file.bin'),
      'https://a.example/file.bin': { status: 200 }
    }, { helpers: { injectFileEntryHandler: fakeFileEntryHandler } });

    http.downloadFile('https://a.example/file', {}, {}, '/tmp/file.bin', function () { args = Array.from(arguments); }, noop);
    args[0].should.equal('fileEntry');
    args[1].url.should.equal('https://a.example/file.bin');
  });

  it('leaves redirects to the platform where native follows them (browser)', () => {
    let failure = null;
    const { http, calls } = loadHttp({
      'https://a.example/start': redirect(302, '/land'),
      'https://a.example/land': { status: 200 }
    }, { nativeFollowsRedirects: true });

    http.get('https://a.example/start', {}, {}, noop, response => { failure = response; });
    calls.length.should.equal(1);
    calls[0].followRedirect.should.equal(true);
    failure.status.should.equal(302);
  });

  it('does not copy global headers into the stored host headers', () => {
    const { http } = loadHttp({ 'https://b.example/land': { status: 200 } });

    http.setHeader('*', 'Authorization', 'Bearer global');
    http.setHeader('b.example', 'X-Host', '1');
    http.get('https://b.example/land', {}, {}, noop, noop);
    http.getHeaders('b.example').should.eql({ 'X-Host': '1' });
  });
});

describe('URL util', function () {
  const jsUtil = require('../www/js-util');
  const util = require('../www/url-util')(jsUtil);

  it('parses URL with protocol, hostname and path correctly', () => {
    util.parseUrl('http://ilkimen.net/test').should.include({
      protocol: 'http:',
      host: 'ilkimen.net',
      hostname: 'ilkimen.net',
      pathname: '/test',
      port: '',
      search: '',
      hash: ''
    });
  });

  it('parses URL with protocol, hostname, port and path correctly', () => {
    util.parseUrl('http://ilkimen.net:8080/test').should.include({
      protocol: 'http:',
      host: 'ilkimen.net:8080',
      hostname: 'ilkimen.net',
      pathname: '/test',
      port: '8080',
      search: '',
      hash: ''
    });
  });

  it('parses URL with protocol, hostname, port, path and query string correctly', () => {
    util.parseUrl('http://ilkimen.net:8080/test?param=value').should.include({
      protocol: 'http:',
      host: 'ilkimen.net:8080',
      hostname: 'ilkimen.net',
      pathname: '/test',
      port: '8080',
      search: '?param=value',
      hash: ''
    });
  });

  it('parses URL with protocol, hostname, port, path, query string and hash param correctly', () => {
    util.parseUrl('http://ilkimen.net:8080/test?param=value#myHash').should.include({
      protocol: 'http:',
      host: 'ilkimen.net:8080',
      hostname: 'ilkimen.net',
      pathname: '/test',
      port: '8080',
      search: '?param=value',
      hash: '#myHash'
    });
  });

  it('serializes query params correctly', () => {
    util.serializeQueryParams({
      strParam1: 'value with spaces',
      strParam2: 'value with special character äöü%',
      boolParam: true,
      numberParam: 1,
      nullParam: null,
    }, false).should.equal('strParam1=value with spaces&strParam2=value with special character äöü%&boolParam=true&numberParam=1&nullParam=null');
  });

  it('serializes query params correctly with URL encoding enabled', () => {
    util.serializeQueryParams({
      'param 1': 'value with spaces',
      'param 2': 'value with special character äöü%&'
    }, true).should.equal('param%201=value%20with%20spaces&param%202=value%20with%20special%20character%20%C3%A4%C3%B6%C3%BC%25%26');
  });

  it('serializes array of query params correctly', () => {
    util.serializeQueryParams({
      myArray: ['val1', 'val2', 'val3'],
      myString: 'testString'
    }, false).should.equal('myArray[]=val1&myArray[]=val2&myArray[]=val3&myString=testString');
  });

  it('serializes deeply structured array of query params correctly', () => {
    util.serializeQueryParams({
      myArray: [['val1.1', 'val1.2', 'val1.3'], 'val2', 'val3'],
      myString: 'testString'
    }, false).should.equal('myArray[][]=val1.1&myArray[][]=val1.2&myArray[][]=val1.3&myArray[]=val2&myArray[]=val3&myString=testString');
  });

  it('serializes deeply structured object of query params correctly', () => {
    util.serializeQueryParams({
      myObject: { obj1: { 'param1.1': 'val1.1', 'param1.2': 'val1.2' }, param2: 'val2' }
    }, false).should.equal('myObject[obj1][param1.1]=val1.1&myObject[obj1][param1.2]=val1.2&myObject[param2]=val2');
  });

  it('appends query params string correctly to given URL without query parameters', () => {
    util.appendQueryParamsString('http://ilkimen.net/', 'param1=value1')
      .should.equal('http://ilkimen.net/?param1=value1');
  });

  it('appends query params string correctly to given URL with existing query parameters', () => {
    util.appendQueryParamsString('http://ilkimen.net/?myParam=myValue', 'param1=value1')
      .should.equal('http://ilkimen.net/?myParam=myValue&param1=value1');
  });

  it('appends query params string correctly to given URL with existing query parameters and hash value', () => {
    util.appendQueryParamsString('http://ilkimen.net/?myParam=myValue#myHash', 'param1=value1')
      .should.equal('http://ilkimen.net/?myParam=myValue&param1=value1#myHash');
  });
});

describe('Common helpers', function () {
  describe('mergeHeaders(globalHeaders, localHeaders)', function () {
    const init = require('../www/helpers');
    init.debug = true;

    const helpers = init(null, null, null, null, null, null);

    it('merges empty header sets correctly', () => {
      helpers.mergeHeaders({}, {}).should.eql({});
    });

    it('merges simple header sets without collision correctly', () => {
      helpers.mergeHeaders({ a: 1 }, { b: 2 }).should.eql({ a: 1, b: 2 });
    });

    it('merges header sets with collision correctly', () => {
      helpers.mergeHeaders({ a: 1 }, { a: 2 }).should.eql({ a: 2 });
    });
  });

  describe('getCookieHeader(url)', function () {
    it('resolves cookie header correctly when no cookie is set #198', () => {
      const helpers = require('../www/helpers')(null, null, { getCookieString: () => '' }, null);

      helpers.getCookieHeader('http://ilkimen.net').should.eql({});
    });

    it('resolves cookie header correctly when a cookie is set', () => {
      const helpers = require('../www/helpers')(null, null, { getCookieString: () => 'cookie=value' }, null);

      helpers.getCookieHeader('http://ilkimen.net').should.eql({ Cookie: 'cookie=value' });
    });
  });

  describe('checkClientAuthOptions()', function () {
    const jsUtil = require('../www/js-util');
    const messages = require('../www/messages');
    const helpers = require('../www/helpers')(null, jsUtil, null, messages);

    it('returns options object with empty values when mode is "none" and no options are given', () => {
      helpers.checkClientAuthOptions('none').should.eql({
        alias: null,
        rawPkcs: null,
        pkcsPassword: ''
      });
    });

    it('returns options object with empty values when mode is "none" and random options are given', () => {
      helpers.checkClientAuthOptions('none', {
        alias: 'myAlias',
        pkcsPath: 'myPath'
      }).should.eql({
        alias: null,
        rawPkcs: null,
        pkcsPassword: ''
      });
    });

    it('throws an error when mode is "systemstore" and alias is not a string or undefined', () => {
      (() => helpers.checkClientAuthOptions('systemstore', { alias: 1 }))
        .should.throw(messages.INVALID_CLIENT_AUTH_ALIAS);

      (() => helpers.checkClientAuthOptions('systemstore', { alias: undefined }))
        .should.not.throw();
    });

    it('returns an object with null alias when mode is "systemstore" and no options object is given', () => {
      helpers.checkClientAuthOptions('systemstore').should.eql({
        alias: null,
        rawPkcs: null,
        pkcsPassword: ''
      });
    });

    it('throws an error when mode is "buffer" and rawPkcs is not an array buffer', () => {
      (() => helpers.checkClientAuthOptions('buffer', {
        rawPkcs: undefined,
        pkcsPassword: 'password'
      })).should.throw(messages.INVALID_CLIENT_AUTH_RAW_PKCS);

      (() => helpers.checkClientAuthOptions('buffer', {
        pkcsPath: 1,
        pkcsPassword: 'password'
      })).should.throw(messages.INVALID_CLIENT_AUTH_RAW_PKCS);
    });

    it('throws an error when mode is "buffer" and pkcsPassword is not a string', () => {
      (() => helpers.checkClientAuthOptions('buffer', {
        rawPkcs: new ArrayBuffer(),
        pkcsPassword: undefined
      })).should.throw(messages.INVALID_CLIENT_AUTH_PKCS_PASSWORD);

      (() => helpers.checkClientAuthOptions('buffer', {
        rawPkcs: new ArrayBuffer(),
        pkcsPassword: 1
      })).should.throw(messages.INVALID_CLIENT_AUTH_PKCS_PASSWORD);
    });
  });

  describe('handleMissingOptions()', function () {
    const jsUtil = require('../www/js-util');
    const messages = require('../www/messages');
    const helpers = require('../www/helpers')(null, jsUtil, null, messages);
    const mockGlobals = {
      headers: {},
      serializer: 'urlencoded',
      followRedirect: true,
      timeout: 60.0,
      connectTimeout: 30.0,
      readTimeout: 30.0
    }

    it('adds missing "followRedirect" option correctly', () => {
      helpers.handleMissingOptions({}, mockGlobals).should.include({ followRedirect: true });
    });

    it('throws an error when "followRedirect" option is not a boolean', () => {
      (() => helpers.handleMissingOptions({ followRedirect: 1 }, mockGlobals))
        .should.throw(messages.INVALID_FOLLOW_REDIRECT_VALUE);
    });
  });

  describe('injectRawResponseHandler()', function () {
    const jsUtil = require('../www/js-util');
    const messages = require('../www/messages');
    const errorCodes = require('../www/error-codes');

    const fakeBase64 = { toArrayBuffer: () => 'fakeArrayBuffer' };

    global.Blob = function (array, meta) {
      this.isFakeBlob = true;
      this.array = array;
      this.meta = meta;
    };

    it('does not change response data if it is an ArrayBuffer', () => {
      const helpers = require('../www/helpers')(null, jsUtil, null, messages, null, errorCodes);
      const buffer = new ArrayBuffer(5);
      const handler = helpers.injectRawResponseHandler(
        'arraybuffer',
        response => response.data.should.be.equal(buffer)
      );

      handler({ data: buffer });
    });

    it('does not change response data if it is a Blob', () => {
      const fakeJsUtil = { getTypeOf: () => 'Blob' };
      const helpers = require('../www/helpers')(null, fakeJsUtil, null, messages, null, errorCodes);
      const handler = helpers.injectRawResponseHandler(
        'blob',
        response => response.data.should.be.equal('fakeData')
      );

      handler({ data: 'fakeData' });
    });

    it('does not change response data if response type is "text"', () => {
      const helpers = require('../www/helpers')(null, jsUtil, null, messages, null, errorCodes);
      const example = 'exampleText';
      const handler = helpers.injectRawResponseHandler(
        'text',
        response => response.data.should.be.equal(example)
      );

      handler({ data: example });
    });

    it('handles response type "json" correctly', () => {
      const fakeData = { myString: 'bla', myNumber: 10 };
      const helpers = require('../www/helpers')(null, jsUtil, null, messages, null, errorCodes);
      const handler = helpers.injectRawResponseHandler(
        'json',
        response => response.data.should.be.eql(fakeData)
      );

      handler({ data: JSON.stringify(fakeData) });
    });

    it('handles empty "json" response correctly', () => {
      const emptyData = "";
      const helpers = require('../www/helpers')(null, jsUtil, null, messages, null, errorCodes);
      const handler = helpers.injectRawResponseHandler(
        'json',
        response => should.equal(undefined, response.data)
      );

      handler({ data: emptyData });
    });

    it('handles response type "arraybuffer" correctly', () => {
      const helpers = require('../www/helpers')(null, jsUtil, null, messages, fakeBase64, errorCodes);
      const handler = helpers.injectRawResponseHandler(
        'arraybuffer',
        response => response.data.should.be.equal('fakeArrayBuffer')
      );

      handler({ data: 'myString' });
    });

    it('handles empty "arraybuffer" response correctly', () => {
      const helpers = require('../www/helpers')(null, jsUtil, null, messages, fakeBase64, errorCodes);
      const handler = helpers.injectRawResponseHandler(
        'arraybuffer',
        response => should.equal(null, response.data)
      );

      handler({ data: '' });
    });

    it('handles response type "blob" correctly', () => {
      const helpers = require('../www/helpers')(null, jsUtil, null, messages, fakeBase64, errorCodes);
      const handler = helpers.injectRawResponseHandler(
        'blob',
        (response) => {
          response.data.isFakeBlob.should.be.equal(true);
          response.data.array.should.be.eql(['fakeArrayBuffer']);
          response.data.meta.type.should.be.equal('fakeType');
        }
      );

      handler({ data: 'myString', headers: { 'content-type': 'fakeType' } });
    });

    it('handles empty "blob" response correctly', () => {
      const helpers = require('../www/helpers')(null, jsUtil, null, messages, fakeBase64, errorCodes);
      const handler = helpers.injectRawResponseHandler(
        'blob',
        (response) => {
          should.equal(null, response.data)
        }
      );

      handler({ data: '', headers: { 'content-type': 'fakeType' } });
    });

    it('calls failure callback when post-processing fails', () => {
      const helpers = require('../www/helpers')(null, jsUtil, null, messages, fakeBase64, errorCodes);
      const handler = helpers.injectRawResponseHandler(
        'json',
        null,
        (response) => {
          response.status.should.be.equal(errorCodes.POST_PROCESSING_FAILED);
          response.error.should.include('Unexpected token');
        }
      );

      handler({ data: 'NotValidJson' });
    });
  });

  describe('checkUploadFileOptions()', function () {
    const jsUtil = require('../www/js-util');
    const messages = require('../www/messages');
    const helpers = require('../www/helpers')(null, jsUtil, null, messages, null, null);

    it('checks valid file options correctly', () => {
      const opts = {
        filePaths: ['file://path/to/file.png'],
        names: ['ScreenCapture']
      };

      // string values
      helpers.checkUploadFileOptions(opts.filePaths[0], opts.names[0]).should.be.eql(opts);
      // string array values
      helpers.checkUploadFileOptions(opts.filePaths, opts.names).should.be.eql(opts);
    });

    it('throws an error when file options are missing', () => {
      (() => helpers.checkUploadFileOptions(undefined, ['ScreenCapture'])).should.throw(messages.FILE_PATHS_TYPE_MISMATCH);
      (() => helpers.checkUploadFileOptions(['file://path/to/file.png'], undefined)).should.throw(messages.NAMES_TYPE_MISMATCH);
    });

    it('throws an error when file options contains empty arrays', () => {
      (() => helpers.checkUploadFileOptions([], ['ScreenCapture'])).should.throw(messages.EMPTY_FILE_PATHS);
      (() => helpers.checkUploadFileOptions(['file://path/to/file.png'], [])).should.throw(messages.EMPTY_NAMES);
    });

    it('throws an error when file options contains invalid values', () => {
      (() => helpers.checkUploadFileOptions([1], ['ScreenCapture'])).should.throw(messages.FILE_PATHS_TYPE_MISMATCH);
      (() => helpers.checkUploadFileOptions(['file://path/to/file.png'], [1])).should.throw(messages.NAMES_TYPE_MISMATCH);
    });
  });

  describe('processData()', function () {
    const mockWindow = {
      Blob: BlobMock,
      File: FileMock,
      FileReader: FileReaderMock,
      FormData: FormDataMock,
      TextEncoder: util.TextEncoder,
    }

    const base64 = { fromArrayBuffer: ab => Buffer.from(ab).toString('base64') };
    const jsUtil = require('../www/js-util');
    const messages = require('../www/messages');
    const dependencyValidator = require('../www/dependency-validator')(mockWindow, null, messages);
    const helpers = require('../www/helpers')(mockWindow, jsUtil, null, messages, base64, null, dependencyValidator, {});

    const testString = 'Test String öäüß 👍😉';
    const testStringBase64 = Buffer.from(testString).toString('base64');

    it('throws an error when given data does not match allowed data types', () => {
      (() => helpers.processData('myString', 'urlencoded')).should.throw(messages.TYPE_MISMATCH_DATA);
      (() => helpers.processData('myString', 'json')).should.throw(messages.TYPE_MISMATCH_DATA);
      (() => helpers.processData({}, 'utf8')).should.throw(messages.TYPE_MISMATCH_DATA);
    });

    it('throws an error when given data does not match allowed instance types', () => {
      (() => helpers.processData('myString', 'multipart')).should.throw(messages.INSTANCE_TYPE_MISMATCH_DATA);
    });

    it('processes data correctly when serializer "utf8" is configured', (cb) => {
      helpers.processData('myString', 'utf8', (data) => {
        data.should.be.eql({ text: 'myString' });
        cb();
      })
    });

    it('processes data correctly when serializer "multipart" is configured and form data contains string value', (cb) => {
      const formData = new FormDataMock();
      formData.append('myString', testString);

      helpers.processData(formData, 'multipart', (data) => {
        data.buffers.length.should.be.equal(1);
        data.names.length.should.be.equal(1);
        data.fileNames.length.should.be.equal(1);
        data.types.length.should.be.equal(1);

        data.buffers[0].should.be.eql(testStringBase64);
        data.names[0].should.be.equal('myString');
        should.equal(data.fileNames[0], null);
        data.types[0].should.be.equal('text/plain');


        cb();
      });
    });

    it('processes data correctly when serializer "multipart" is configured and form data contains file value', (cb) => {
      const formData = new FormDataMock();
      formData.append('myFile', new BlobMock([testString], { type: 'application/octet-stream' }));

      helpers.processData(formData, 'multipart', (data) => {
        data.buffers.length.should.be.equal(1);
        data.names.length.should.be.equal(1);
        data.fileNames.length.should.be.equal(1);
        data.types.length.should.be.equal(1);

        data.buffers[0].should.be.eql(testStringBase64);
        data.names[0].should.be.equal('myFile');
        data.fileNames[0].should.be.equal('blob');
        data.types[0].should.be.equal('application/octet-stream');

        cb();
      });
    });

    it('processes data correctly when serializer "multipart" is configured and form data contains file value (filename set)', (cb) => {
      const formData = new FormDataMock();
      formData.append('myFile', new BlobMock([testString], { type: 'application/octet-stream' }), 'file.name');

      helpers.processData(formData, 'multipart', (data) => {
        data.buffers.length.should.be.equal(1);
        data.names.length.should.be.equal(1);
        data.fileNames.length.should.be.equal(1);
        data.types.length.should.be.equal(1);

        data.buffers[0].should.be.eql(testStringBase64);
        data.names[0].should.be.equal('myFile');
        data.fileNames[0].should.be.equal('file.name');
        data.types[0].should.be.equal('application/octet-stream');

        cb();
      });
    });

    it('processes data correctly when serializer "multipart" is configured and form data contains file value (filename empty)', (cb) => {
      const formData = new FormDataMock();
      formData.append('myFile', new BlobMock([testString], { type: 'application/octet-stream' }), '');

      helpers.processData(formData, 'multipart', (data) => {
        data.buffers.length.should.be.equal(1);
        data.names.length.should.be.equal(1);
        data.fileNames.length.should.be.equal(1);
        data.types.length.should.be.equal(1);

        data.buffers[0].should.be.eql(testStringBase64);
        data.names[0].should.be.equal('myFile');
        data.fileNames[0].should.be.equal('');
        data.types[0].should.be.equal('application/octet-stream');

        cb();
      });
    });

    it('processes data correctly when serializer "raw" is configured', (cb) => {
      const byteArray = new Uint8Array([1, 2, 3]);
      helpers.processData(byteArray, 'raw', (data) => {
        data.should.be.a('ArrayBuffer');
        data.should.be.equal(byteArray.buffer);
        cb();
      })
    });
  });

  describe('nextRequestId()', function () {
    const helpers = require('../www/helpers')(null, null, null, null, null, null);

    it('returns number requestIds', () => {
      helpers.nextRequestId().should.be.a('number');
    });

    it('returns unique requestIds', () => {
      const ids = [helpers.nextRequestId(), helpers.nextRequestId(), helpers.nextRequestId()];
      const set = new Set(ids);
      ids.should.to.deep.equal(Array.from(set));
    });
  });
});

describe('Dependency Validator', function () {
  const messages = require('../www/messages');

  describe('logWarnings()', function () {
    it('logs a warning message if FormData API is not supported', function () {
      const console = new ConsoleMock();

      require('../www/dependency-validator')({}, console, messages).logWarnings();

      console.messageList.length.should.be.equal(1);
      console.messageList[0].type.should.be.equal('warn');
      console.messageList[0].message.should.be.eql([messages.MISSING_FORMDATA_API]);
    });

    it('logs a warning message if FormData.entries() API is not supported', function () {
      const console = new ConsoleMock();

      require('../www/dependency-validator')({ FormData: {} }, console, messages).logWarnings();

      console.messageList.length.should.be.equal(1);
      console.messageList[0].type.should.be.equal('warn');
      console.messageList[0].message.should.be.eql([messages.MISSING_FORMDATA_ENTRIES_API]);
    });
  });

  describe('checkBlobApi()', function () {
    it('throws an error if Blob API is not supported', function () {
      const console = new ConsoleMock();
      const validator = require('../www/dependency-validator')({}, console, messages);

      (() => validator.checkBlobApi()).should.throw(messages.MISSING_BLOB_API);
    });
  });

  describe('checkFileReaderApi()', function () {
    it('throws an error if FileReader API is not supported', function () {
      const console = new ConsoleMock();
      const validator = require('../www/dependency-validator')({}, console, messages);

      (() => validator.checkFileReaderApi()).should.throw(messages.MISSING_FILE_READER_API);
    });
  });

  describe('checkFormDataInstance()', function () {
    it('throws an error if FormData.entries() is not supported on given instance', function () {
      const console = new ConsoleMock();
      const validator = require('../www/dependency-validator')({ FormData: {} }, console, messages);

      (() => validator.checkFormDataInstance({})).should.throw(messages.MISSING_FORMDATA_ENTRIES_API);
    });
  });

  describe('checkTextEncoderApi()', function () {
    it('throws an error if TextEncoder API is not supported', function () {
      const console = new ConsoleMock();
      const validator = require('../www/dependency-validator')({}, console, messages);

      (() => validator.checkTextEncoderApi()).should.throw(messages.MISSING_TEXT_ENCODER_API);
    });
  });
});

describe('Ponyfills', function () {
  const mockWindow = {
    Blob: BlobMock,
    File: FileMock,
  };

  const init = require('../www/ponyfills');
  init.debug = true;
  const ponyfills = init(mockWindow);

  describe('Iterator', function () {
    it('exposes interface correctly', () => {
      const iterator = new ponyfills.Iterator([]);
      iterator.next.should.be.a('function');
    });

    describe('next()', function () {
      it('returns iteration object correctly when list is empty', () => {
        const iterator = new ponyfills.Iterator([]);
        iterator.next().should.be.eql({ done: true, value: undefined });
      });

      it('returns iteration object correctly when end posititon of list is not reached yet', () => {
        const iterator = new ponyfills.Iterator([['first', 'this is the first item']]);
        iterator.next().should.be.eql({ done: false, value: ['first', 'this is the first item'] });
      });

      it('returns iteration object correctly when end posititon of list is already reached', () => {
        const iterator = new ponyfills.Iterator([['first', 'this is the first item']]);
        iterator.next();
        iterator.next().should.be.eql({ done: true, value: undefined });
      });
    });
  });

  describe('FormData', function () {
    it('exposes interface correctly', () => {
      const formData = new ponyfills.FormData();

      formData.append.should.be.a('function');
      formData.entries.should.be.a('function');
    });

    describe('append()', function () {
      it('appends string value correctly', () => {
        const formData = new ponyfills.FormData();

        formData.append('test', 'myTestString');
        formData.__items[0].should.be.eql(['test', 'myTestString']);
      });

      it('appends numeric value correctly', () => {
        const formData = new ponyfills.FormData();

        formData.append('test', 10);
        formData.__items[0].should.be.eql(['test', '10']);
        formData.__items[0][1].should.be.a('string');
      });

      it('appends Blob value correctly', () => {
        const formData = new ponyfills.FormData();
        const blob = new BlobMock(['another test'], { type: 'text/plain' });

        formData.append('myBlob', blob, 'myFileName.txt');
        formData.__items[0].should.be.eql(['myBlob', blob]);
        formData.__items[0][1].name.should.be.equal('myFileName.txt');
        formData.__items[0][1].lastModifiedDate.should.be.a('Date');
      });

      it('appends File value correctly', () => {
        const formData = new ponyfills.FormData();
        const blob = new BlobMock(['another test'], { type: 'text/plain' });
        const file = new FileMock(blob, 'myFileName.txt');

        formData.append('myFile', file, 'myOverriddenFileName.txt');
        formData.__items[0].should.be.eql(['myFile', file]);
        formData.__items[0][1].name.should.be.equal('myFileName.txt');
        formData.__items[0][1].lastModifiedDate.should.be.eql(file.lastModifiedDate);
      });
    });

    describe('entries()', function () {
      it('returns an iterator correctly', () => {
        const formData = new ponyfills.FormData();

        formData.entries().should.be.an.instanceof(ponyfills.Iterator);
      })
    });
  });
});
