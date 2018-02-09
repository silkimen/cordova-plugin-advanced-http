const chai = require('chai');
const mock = require('mock-require');
const path = require('path');

const should = chai.should();

const HELPERS_ID = path.resolve(__dirname, '..', 'www', 'helpers');
const PLUGIN_ID = path.resolve(__dirname, '..', 'www', 'advanced-http');

describe('Advanced HTTP www interface', function() {
  let http = {};
  let helpers = {};

  const noop = () => { /* intentionally doing nothing */ };

  const loadHttp = () => {
    mock(`${PLUGIN_ID}.helpers`, mock.reRequire('../www/helpers'));
    http = mock.reRequire('../www/advanced-http');
  };

  this.timeout(900000);

  beforeEach(() => {
    // mocked btoa function (base 64 encoding strings)
    global.btoa = decoded => new Buffer(decoded).toString('base64');

    mock('cordova/exec', noop);
    mock(`${PLUGIN_ID}.cookie-handler`, {});
    mock(`${HELPERS_ID}.cookie-handler`, {});
    mock(`${PLUGIN_ID}.messages`, require('../www/messages'));
    mock(`${HELPERS_ID}.messages`, require('../www/messages'));
    mock(`${PLUGIN_ID}.angular-integration`, { registerService: noop });

    loadHttp();
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
    mock(`${HELPERS_ID}.cookie-handler`, {
      getCookieString: () => 'fakeCookieString'
    });

    mock('cordova/exec', (onSuccess, onFail, namespace, method, params) => {
      const headers = params[2];
      headers.should.eql({
        Cookie: 'fakeCookieString',
        myKey: 'myValue'
      });
    });

    loadHttp();

    http.setHeader('*', 'myKey', 'myValue');
    http.get('url', {}, {}, noop, noop);
  });

  it('resolves host headers correctly (set without port number) #37', () => {
    mock(`${HELPERS_ID}.cookie-handler`, {
      getCookieString: () => 'fakeCookieString'
    });

    mock('cordova/exec', (onSuccess, onFail, namespace, method, params) => {
      const headers = params[2];
      headers.should.eql({
        Cookie: 'fakeCookieString',
        myKey: 'myValue'
      });
    });

    loadHttp();

    http.setHeader('www.google.de', 'myKey', 'myValue');
    http.get('https://www.google.de/?gws_rd=ssl', {}, {}, noop, noop);
  });

  it('resolves host headers correctly (set with port number) #37', () => {
    mock(`${HELPERS_ID}.cookie-handler`, {
      getCookieString: () => 'fakeCookieString'
    });

    mock('cordova/exec', (onSuccess, onFail, namespace, method, params) => {
      const headers = params[2];
      headers.should.eql({
        Cookie: 'fakeCookieString',
        myKey: 'myValue'
      });
    });

    loadHttp();

    http.setHeader('www.google.de:8080', 'myKey', 'myValue');
    http.get('https://www.google.de:8080/?gws_rd=ssl', {}, {}, noop, noop);
  });

  it('resolves request headers correctly', () => {
    mock(`${HELPERS_ID}.cookie-handler`, {
      getCookieString: () => 'fakeCookieString'
    });

    mock('cordova/exec', (onSuccess, onFail, namespace, method, params) => {
      const headers = params[2];
      headers.should.eql({
        Cookie: 'fakeCookieString',
        myKey: 'myValue'
      });
    });

    loadHttp();

    http.get('https://www.google.de/?gws_rd=ssl', {}, { myKey: 'myValue' }, noop, noop);
  });

  it('sets basic authentication header correctly #36', () => {
    http.useBasicAuth('name', 'pass');
    http.getHeaders('*').Authorization.should.equal('Basic bmFtZTpwYXNz');
  });

  it('throws an Error when you try to add a cookie by using "setHeader" #46', () => {
    (function() { http.setHeader('*', 'cookie', 'value') }).should.throw();
  });
});
