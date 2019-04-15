const chai = require('chai');
const mock = require('mock-require');
const should = chai.should();

describe('Advanced HTTP public interface', function () {
  let http = {};

  const noop = () => { /* intentionally doing nothing */ };

  const getDependenciesBlueprint = () => {
    const messages = require('../www/messages');
    const globalConfigs = require('../www/global-configs');
    const jsUtil = require('../www/js-util');
    const ToughCookie = require('../www/umd-tough-cookie');
    const lodash = require('../www/lodash');
    const WebStorageCookieStore = require('../www/local-storage-store')(ToughCookie, lodash);
    const cookieHandler = require('../www/cookie-handler')(null, ToughCookie, WebStorageCookieStore);
    const helpers = require('../www/helpers')(jsUtil, cookieHandler, messages);
    const urlUtil = require('../www/url-util')(jsUtil);

    return { exec: noop, cookieHandler, urlUtil: urlUtil, helpers, globalConfigs };
  };

  const loadHttp = (deps) => {
    http = require('../www/public-interface')(deps.exec, deps.cookieHandler, deps.urlUtil, deps.helpers, deps.globalConfigs);
  };

  beforeEach(() => {
    // mocked btoa function (base 64 encoding strings)
    global.btoa = decoded => new Buffer(decoded).toString('base64');
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
    (function () { http.setHeader('*', 'cookie', 'value') }).should.throw();
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

    const helpers = init(null, null, null);

    it('merges empty header sets correctly', () => {
      helpers.mergeHeaders({}, {}).should.eql({});
    });
  });

  describe('getCookieHeader(url)', function () {
    it('resolves cookie header correctly when no cookie is set #198', () => {
      const helpers = require('../www/helpers')(null, { getCookieString: () => '' }, null);

      helpers.getCookieHeader('http://ilkimen.net').should.eql({});
    });

    it('resolves cookie header correctly when a cookie is set', () => {
      const helpers = require('../www/helpers')(null, { getCookieString: () => 'cookie=value' }, null);

      helpers.getCookieHeader('http://ilkimen.net').should.eql({ Cookie: 'cookie=value' });
    });
  });

  describe('checkClientAuthOptions()', function () {
    const jsUtil = require('../www/js-util');
    const messages = require('../www/messages');
    const helpers = require('../www/helpers')(jsUtil, null, messages);

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
})
