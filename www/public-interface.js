module.exports = function init(exec, cookieHandler, urlUtil, helpers, globalConfigs, errorCodes, ponyfills, nativeFollowsRedirects) {
  var pendingRequests = {};

  var publicInterface = {
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
    getFollowRedirect: getFollowRedirect,
    setFollowRedirect: setFollowRedirect,
    // @Android Only
    getConnectTimeout: getConnectTimeout,
    // @Android Only
    setConnectTimeout: setConnectTimeout,
    getReadTimeout: getReadTimeout,
    setReadTimeout: setReadTimeout,
    setServerTrustMode: setServerTrustMode,
    setClientAuthMode: setClientAuthMode,
    sendRequest: sendRequest,
    post: post,
    put: put,
    patch: patch,
    get: get,
    delete: del,
    head: head,
    options: options,
    uploadFile: uploadFile,
    downloadFile: downloadFile,
    abort: abort,
    ErrorCode: errorCodes,
    ponyfills: ponyfills
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

    if (value === null) {
      delete globalConfigs.headers[host][header];
    } else {
      globalConfigs.headers[host][header] = value;
    }
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
    globalConfigs.timeout = helpers.checkTimeoutValue(timeout);
    globalConfigs.connectTimeout = helpers.checkTimeoutValue(timeout);
    globalConfigs.readTimeout = helpers.checkTimeoutValue(timeout);
  }

  function getConnectTimeout() {
    return globalConfigs.connectTimeout;
  }

  function setConnectTimeout(timeout) {
    globalConfigs.connectTimeout = helpers.checkTimeoutValue(timeout);
  }

  function getReadTimeout() {
    return globalConfigs.readTimeout;
  }

  function setReadTimeout(timeout) {
    globalConfigs.readTimeout = helpers.checkTimeoutValue(timeout);
  }

  function getFollowRedirect() {
    return globalConfigs.followRedirect;
  }

  function setFollowRedirect(follow) {
    globalConfigs.followRedirect = helpers.checkFollowRedirectValue(follow);
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

    var reqId = helpers.nextRequestId();
    var request = { url: url, method: options.method, bodyDropped: false, crossedOrigin: false, redirectCount: 0 };

    pendingRequests[reqId] = { aborted: false };
    dispatchRequest(reqId, request, options, success, failure);

    return reqId;
  }

  // On Android and iOS native never follows redirects: every hop comes back here, so
  // cookies set on a redirect response are stored for the URL that set them, and each
  // hop gets only the headers and cookies that belong to it (helpers.getRequestHeaders).
  // The browser platform cannot see intermediate responses and lets XHR follow them.
  function dispatchRequest(reqId, request, options, success, failure) {
    var url = request.url;
    var headers = helpers.getRequestHeaders(request, options.headers, globalConfigs.headers);
    var followRedirect = nativeFollowsRedirects ? options.followRedirect : false;

    var finishWith = function (callback) {
      return function () {
        delete pendingRequests[reqId];
        callback.apply(null, arguments);
      };
    };

    var isAborted = function () {
      return pendingRequests[reqId] && pendingRequests[reqId].aborted;
    };

    var onFail = helpers.injectCookieHandler(url, function (response) {
      var follows = options.followRedirect && !nativeFollowsRedirects;
      var nextRequest = follows ? helpers.getRedirectRequest(request, response) : null;

      if (!nextRequest) {
        return finishWith(failure)(response);
      }

      if (nextRequest.error) {
        return finishWith(failure)(nextRequest.error);
      }

      if (isAborted()) {
        return finishWith(failure)(helpers.getAbortedResponse(url));
      }

      dispatchRequest(reqId, nextRequest, options, success, failure);
    });

    var onSuccess = helpers.injectCookieHandler(url, helpers.injectRawResponseHandler(options.responseType, finishWith(success), finishWith(failure)));

    switch (request.method) {
      case 'post':
      case 'put':
      case 'patch':
        helpers.processData(options.data, options.serializer, function (data) {
          // serializing can be asynchronous, the request may have been aborted meanwhile
          if (isAborted()) {
            return finishWith(failure)(helpers.getAbortedResponse(url));
          }

          exec(onSuccess, onFail, 'CordovaHttpPlugin', request.method, [url, data, options.serializer, headers, options.connectTimeout, options.readTimeout, followRedirect, options.responseType, reqId]);
        });
        break;
      case 'upload':
        var fileOptions = helpers.checkUploadFileOptions(options.filePath, options.name);
        exec(onSuccess, onFail, 'CordovaHttpPlugin', 'uploadFiles', [url, headers, fileOptions.filePaths, fileOptions.names, options.connectTimeout, options.readTimeout, followRedirect, options.responseType, reqId]);
        break;
      case 'download':
        var filePath = helpers.checkDownloadFilePath(options.filePath);
        var onDownloadSuccess = helpers.injectCookieHandler(url, helpers.injectFileEntryHandler(finishWith(success)));
        exec(onDownloadSuccess, onFail, 'CordovaHttpPlugin', 'downloadFile', [url, headers, filePath, options.connectTimeout, options.readTimeout, followRedirect, reqId]);
        break;
      default:
        exec(onSuccess, onFail, 'CordovaHttpPlugin', request.method, [url, headers, options.connectTimeout, options.readTimeout, followRedirect, options.responseType, reqId]);
        break;
    }
  }

  function post(url, data, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'post', data: data, headers: headers }, success, failure);
  }

  function put(url, data, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'put', data: data, headers: headers }, success, failure);
  }

  function patch(url, data, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'patch', data: data, headers: headers }, success, failure);
  }

  function get(url, params, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'get', params: params, headers: headers }, success, failure);
  }

  function del(url, params, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'delete', params: params, headers: headers }, success, failure);
  }

  function head(url, params, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'head', params: params, headers: headers }, success, failure);
  }

  function options(url, params, headers, success, failure) {
    return publicInterface.sendRequest(url, { method: 'options', params: params, headers: headers }, success, failure);
  }

  function uploadFile(url, params, headers, filePath, name, success, failure) {
    return publicInterface.sendRequest(url, { method: 'upload', params: params, headers: headers, filePath: filePath, name: name }, success, failure);
  }

  function downloadFile(url, params, headers, filePath, success, failure) {
    return publicInterface.sendRequest(url, { method: 'download', params: params, headers: headers, filePath: filePath }, success, failure);
  }

  function abort(requestId , success, failure) {
    if (pendingRequests[requestId]) {
      pendingRequests[requestId].aborted = true;
    }

    return exec(success, failure, 'CordovaHttpPlugin', 'abort', [requestId]);
  }

  return publicInterface;
}
