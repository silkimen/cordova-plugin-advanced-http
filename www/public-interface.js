module.exports = function init(exec, cookieHandler, urlUtil, helpers, globalConfigs) {
  const publicInterface = {
    getBasicAuthHeader: getBasicAuthHeader,
    useBasicAuth: useBasicAuth,
    getHeaders: getHeaders,
    setHeader: setHeader,
    getDataSerializer: getDataSerializer,
    setDataSerializer: setDataSerializer,
    setCookie: setCookie,
    clearCookies: clearCookies,
    removeCookies: removeCookies,
    getCookieString: getCookieString,
    getRequestTimeout: getRequestTimeout,
    setRequestTimeout: setRequestTimeout,
    disableRedirect: disableRedirect,
    // for being backward compatible
    setSSLCertMode: setServerTrustMode,
    setServerTrustMode: setServerTrustMode,
    setClientAuthMode: setClientAuthMode,
    sendRequest: sendRequest,
    post: post,
    get: get,
    put: put,
    patch: patch,
    delete: del,
    head: head,
    uploadFile: uploadFile,
    downloadFile: downloadFile
  };

  function getBasicAuthHeader(username, password) {
    return { 'Authorization': 'Basic ' + helpers.b64EncodeUnicode(username + ':' + password) };
  }

  function useBasicAuth(username, password) {
    this.setHeader('*', 'Authorization', 'Basic ' + helpers.b64EncodeUnicode(username + ':' + password));
  }

  function getHeaders(host) {
    return globalConfigs.headers[host || '*'] || null;
  }

  function setHeader() {
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
  }

  function getDataSerializer() {
    return globalConfigs.serializer;
  }

  function setDataSerializer(serializer) {
    globalConfigs.serializer = helpers.checkSerializer(serializer);
  }

  function setCookie(url, cookie, options) {
    cookieHandler.setCookie(url, cookie, options);
  }

  function clearCookies() {
    cookieHandler.clearCookies();
  }

  function removeCookies(url, callback) {
    cookieHandler.removeCookies(url, callback);
  }

  function getCookieString(url) {
    return cookieHandler.getCookieString(url);
  }

  function getRequestTimeout() {
    return globalConfigs.timeout;
  }

  function setRequestTimeout(timeout) {
    globalConfigs.timeout = timeout;
  }

  function getFollowRedirect() {
    return globalConfigs.followRedirect;
  }

  function setFollowRedirect(follow) {
    globalConfigs.followRedirect = follow;
  }

  // @TODO replace this one by "setFollowRedirect()"
  function disableRedirect(disable, success, failure) {
    helpers.handleMissingCallbacks(success, failure);

    return exec(success, failure, 'CordovaHttpPlugin', 'disableRedirect', [!!disable]);
  }

  function setServerTrustMode(mode, success, failure) {
    helpers.handleMissingCallbacks(success, failure);

    return exec(success, failure, 'CordovaHttpPlugin', 'setServerTrustMode', [helpers.checkSSLCertMode(mode)]);
  }

  function setClientAuthMode() {
    var mode = arguments[0];
    var options = null;
    var success = arguments[1];
    var failure = arguments[2];

    if (arguments.length === 4) {
      options = arguments[1];
      success = arguments[2];
      failure = arguments[3];
    }

    mode = helpers.checkClientAuthMode(mode);
    options = helpers.checkClientAuthOptions(mode, options);

    helpers.handleMissingCallbacks(success, failure);

    return exec(success, failure, 'CordovaHttpPlugin', 'setClientAuthMode', [mode, options.alias, options.rawPkcs, options.pkcsPassword]);
  }

  function sendRequest(url, options, success, failure) {
    helpers.handleMissingCallbacks(success, failure);

    options = helpers.handleMissingOptions(options, globalConfigs);
    url = urlUtil.appendQueryParamsString(url, urlUtil.serializeQueryParams(options.params, true));

    var headers = helpers.getMergedHeaders(url, options.headers, globalConfigs.headers);
    var onSuccess = helpers.injectCookieHandler(url, success);
    var onFail = helpers.injectCookieHandler(url, failure);

    switch (options.method) {
      case 'post':
      case 'put':
      case 'patch':
        var data = helpers.getProcessedData(options.data, options.serializer);
        return exec(onSuccess, onFail, 'CordovaHttpPlugin', options.method, [url, data, options.serializer, headers, options.timeout, options.followRedirect]);
      case 'upload':
        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'uploadFile', [url, headers, options.filePath, options.name, options.timeout, options.followRedirect]);
      case 'download':
        var onDownloadSuccess = helpers.injectCookieHandler(url, helpers.injectFileEntryHandler(success));
        return exec(onDownloadSuccess, onFail, 'CordovaHttpPlugin', 'downloadFile', [url, headers, options.filePath, options.timeout, options.followRedirect]);
      default:
        return exec(onSuccess, onFail, 'CordovaHttpPlugin', options.method, [url, headers, options.timeout, options.followRedirect]);
    }
  }

  function post(url, data, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'post', data: data, headers: headers }, success, failure);
  };

  function get(url, params, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'get', params: params, headers: headers }, success, failure);
  };

  function put(url, data, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'put', data: data, headers: headers }, success, failure);
  }

  function patch(url, data, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'patch', data: data, headers: headers }, success, failure);
  }

  function del(url, params, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'delete', params: params, headers: headers }, success, failure);
  }

  function head(url, params, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'head', params: params, headers: headers }, success, failure);
  }

  function uploadFile(url, params, headers, filePath, name, success, failure) {
    return publicInterface.sendRequest(url, { method: 'upload', params: params, headers: headers, filePath: filePath, name: name }, success, failure);
  }

  function downloadFile(url, params, headers, filePath, success, failure) {
    return publicInterface.sendRequest(url, { method: 'download', params: params, headers: headers, filePath: filePath }, success, failure);
  }

  return publicInterface;
}
