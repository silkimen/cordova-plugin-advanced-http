const chai = require('chai');
const mock = require('mock-require');
const path = require('path');

const should = chai.should();
const PLUGIN_ID = path.resolve(__dirname, '..', 'www', 'advanced-http');

describe('Advanced HTTP www interface', function() {
  let http = {};
  const noop = () => { /* intentionally doing nothing */ };
  const loadHttp = () => {
    http = mock.reRequire('../www/advanced-http');
  };

  this.timeout(900000);

  beforeEach(() => {
    mock('cordova/exec', noop);
    mock(`${PLUGIN_ID}.angular-integration`, { registerService: noop });
    mock(`${PLUGIN_ID}.cookie-handler`, {});
    loadHttp();
  });

  it('sets global headers correctly with two args (old interface)', () => {
    http.setHeader('myKey', 'myValue');
    http.headers['*'].myKey.should.equal('myValue');
  });

  it('sets global headers correctly with three args (new interface)', () => {
    http.setHeader('*', 'myKey', 'myValue');
    http.headers['*'].myKey.should.equal('myValue');
  });

  it('sets host headers correctly', () => {
    http.setHeader('www.google.de', 'myKey', 'myValue');
    http.headers['www.google.de'].myKey.should.equal('myValue');
  });

  it('resolves global headers correctly', () => {
    mock(`${PLUGIN_ID}.cookie-handler`, {
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

  it('resolves host headers correctly', () => {
    mock(`${PLUGIN_ID}.cookie-handler`, {
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

  it('resolves request headers correctly', () => {
    mock(`${PLUGIN_ID}.cookie-handler`, {
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
});
