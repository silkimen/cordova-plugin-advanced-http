/*
 * A native HTTP Plugin for Cordova / PhoneGap.
 */

var pluginId = module.id.slice(0, module.id.lastIndexOf('.'));

var exec = require('cordova/exec');
var cookieHandler = require(pluginId + '.cookie-handler');
var helpers = require(pluginId + '.helpers');

var globalConfigs = {
  headers: {},
  serializer: 'urlencoded',
  timeout: 60.0,
};

var publicInterface = {
  getBasicAuthHeader: function (username, password) {
    return {'Authorization': 'Basic ' + helpers.b64EncodeUnicode(username + ':' + password)};
  },
  useBasicAuth: function (username, password) {
    this.setHeader('*', 'Authorization', 'Basic ' + helpers.b64EncodeUnicode(username + ':' + password));
  },
  getHeaders: function (host) {
    return globalConfigs.headers[host || '*'] || null;
  },
  setHeader: function () {
    // this one is for being backward compatible
    var host = '*';
    var header = arguments[0];
    var value = arguments[1];

    if (arguments.length === 3) {
        host = arguments[0];
        header = arguments[1];
        value = arguments[2];
    }

    helpers.checkForBlacklistedHeaderKey(header);
    helpers.checkForInvalidHeaderValue(value);

    globalConfigs.headers[host] = globalConfigs.headers[host] || {};
    globalConfigs.headers[host][header] = value;
  },
  getDataSerializer: function () {
    return globalConfigs.serializer;
  },
  setDataSerializer: function (serializer) {
    globalConfigs.serializer = helpers.checkSerializer(serializer);
  },
  setCookie: function (url, cookie, options) {
    cookieHandler.setCookie(url, cookie, options);
  },
  clearCookies: function () {
    cookieHandler.clearCookies();
  },
  removeCookies: function (url, callback) {
    cookieHandler.removeCookies(url, callback);
  },
  getCookieString: function (url) {
    return cookieHandler.getCookieString(url);
  },
  getRequestTimeout: function () {
    return globalConfigs.timeout;
  },
  setRequestTimeout: function (timeout) {
    globalConfigs.timeout = timeout;
  },
  setSSLCertMode: function (mode, success, failure) {
    return exec(success, failure, 'CordovaHttpPlugin', 'setSSLCertMode', [ helpers.checkSSLCertMode(mode) ]);
  },
  disableRedirect: function (disable, success, failure) {
    return exec(success, failure, 'CordovaHttpPlugin', 'disableRedirect', [ !!disable ]);
  },
  sendRequest: function (url, options, success, failure) {
    helpers.handleMissingCallbacks(success, failure);

    options = helpers.handleMissingOptions(options, globalConfigs);

    var headers = helpers.getMergedHeaders(url, options.headers, globalConfigs.headers);
    var onSuccess = helpers.injectCookieHandler(url, success);
    var onFail = helpers.injectCookieHandler(url, failure);

    switch(options.method) {
      case 'post':
      case 'put':
      case 'patch':
        var data = helpers.getProcessedData(options.data, options.serializer);
        return exec(onSuccess, onFail, 'CordovaHttpPlugin', options.method, [ url, data, options.serializer, headers, options.timeout ]);
      case 'post_multipart':
        var data = helpers.getProcessedData(options.data, options.serializer);
        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'post_multipart', [ url, data, options.serializer, headers, options.filePaths, options.name, options.timeout ]);
      case 'download':
        var onDownloadSuccess = helpers.injectCookieHandler(url, helpers.injectFileEntryHandler(success));
        return exec(onDownloadSuccess, onFail, 'CordovaHttpPlugin', 'downloadFile', [ url, options.params, headers, options.filePath, options.timeout ]);
      default:
        return exec(onSuccess, onFail, 'CordovaHttpPlugin', options.method, [ url, options.params, headers, options.timeout ]);
    }
  },
  post: function (url, data, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'post', data: data, headers: headers }, success, failure);
  },
  postMultipart: function (url, data, headers, filePaths, name, success, failure) {
    return publicInterface.sendRequest(url, { method: 'post_multipart', data: data, headers: headers, filePaths: filePaths, name: name }, success, failure);
  },
  get: function (url, params, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'get', params: params, headers: headers }, success, failure);
  },
  put: function (url, data, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'put', data: data, headers: headers }, success, failure);
  },
  patch: function (url, data, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'patch', data: data, headers: headers }, success, failure);
  },
  delete: function (url, params, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'delete', params: params, headers: headers }, success, failure);
  },
  head: function (url, params, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'head', params: params, headers: headers }, success, failure);
  },
  downloadFile: function (url, params, headers, filePath, success, failure) {
    return publicInterface.sendRequest(url, { method: 'download', params: params, headers: headers, filePath: filePath }, success, failure);
  }
};

module.exports = publicInterface;
