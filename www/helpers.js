module.exports = function init(cookieHandler, messages) {
  var validSerializers = ['urlencoded', 'json', 'utf8'];
  var validCertModes = ['default', 'nocheck', 'pinned', 'legacy'];
  var validClientAuthModes = ['none', 'systemstore', 'file'];
  var validHttpMethods = ['get', 'put', 'post', 'patch', 'head', 'delete', 'upload', 'download'];

  return {
    b64EncodeUnicode: b64EncodeUnicode,
    getTypeOf: getTypeOf,
    checkSerializer: checkSerializer,
    checkSSLCertMode: checkSSLCertMode,
    checkClientAuthMode: checkClientAuthMode,
    checkForBlacklistedHeaderKey: checkForBlacklistedHeaderKey,
    checkForInvalidHeaderValue: checkForInvalidHeaderValue,
    injectCookieHandler: injectCookieHandler,
    injectFileEntryHandler: injectFileEntryHandler,
    getMergedHeaders: getMergedHeaders,
    getProcessedData: getProcessedData,
    handleMissingCallbacks: handleMissingCallbacks,
    handleMissingOptions: handleMissingOptions
  };

  // Thanks Mozilla: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_.22Unicode_Problem.22
  function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
  }

  function mergeHeaders(globalHeaders, localHeaders) {
    var globalKeys = Object.keys(globalHeaders);
    var key;

    for (var i = 0; i < globalKeys.length; i++) {
      key = globalKeys[i];

      if (!localHeaders.hasOwnProperty(key)) {
        localHeaders[key] = globalHeaders[key];
      }
    }

    return localHeaders;
  }

  function checkForValidStringValue(list, value, onInvalidValueMessage) {
    if (getTypeOf(value) !== 'String') {
      throw new Error(onInvalidValueMessage + ' ' + list.join(', '));
    }

    value = value.trim().toLowerCase();

    if (list.indexOf(value) === -1) {
      throw new Error(onInvalidValueMessage + ' ' + list.join(', '));
    }

    return value;
  }

  function checkKeyValuePairObject(obj, allowedChildren, onInvalidValueMessage) {
    if (getTypeOf(obj) !== 'Object') {
      throw new Error(onInvalidValueMessage);
    }

    var keys = Object.keys(obj);

    for (var i = 0; i < keys.length; i++) {
      if (allowedChildren.indexOf(getTypeOf(obj[keys[i]])) === -1) {
        throw new Error(onInvalidValueMessage);
      }
    }

    return obj;
  }

  function checkHttpMethod(method) {
    return checkForValidStringValue(validHttpMethods, method, messages.INVALID_HTTP_METHOD);
  }

  function checkSerializer(serializer) {
    return checkForValidStringValue(validSerializers, serializer, messages.INVALID_DATA_SERIALIZER);
  }

  function checkSSLCertMode(mode) {
    return checkForValidStringValue(validCertModes, mode, messages.INVALID_SSL_CERT_MODE);
  }

  function checkClientAuthMode(mode) {
    return checkForValidStringValue(validClientAuthModes, mode, messages.INVALID_CLIENT_AUTH_MODE);
  }

  function checkForBlacklistedHeaderKey(key) {
    if (key.toLowerCase() === 'cookie') {
      throw new Error(messages.ADDING_COOKIES_NOT_SUPPORTED);
    }

    return key;
  }

  function checkForInvalidHeaderValue(value) {
    if (getTypeOf(value) !== 'String') {
      throw new Error(messages.INVALID_HEADERS_VALUE);
    }

    return value;
  }

  function checkTimeoutValue(timeout) {
    if (getTypeOf(timeout) !== 'Number' || timeout < 0) {
      throw new Error(messages.INVALID_TIMEOUT_VALUE);
    }

    return timeout;
  }

  function checkHeadersObject(headers) {
    return checkKeyValuePairObject(headers, ['String'], messages.INVALID_HEADERS_VALUE);
  }

  function checkParamsObject(params) {
    return checkKeyValuePairObject(params, ['String', 'Array'], messages.INVALID_PARAMS_VALUE);
  }

  function resolveCookieString(headers) {
    var keys = Object.keys(headers || {});

    for (var i = 0; i < keys.length; ++i) {
      if (keys[i].match(/^set-cookie$/i)) {
        return headers[keys[i]];
      }
    }

    return null;
  }

  function createFileEntry(rawEntry) {
    var entry = new (require('cordova-plugin-file.FileEntry'))();

    entry.isDirectory = rawEntry.isDirectory;
    entry.isFile = rawEntry.isFile;
    entry.name = rawEntry.name;
    entry.fullPath = rawEntry.fullPath;
    entry.filesystem = new FileSystem(rawEntry.filesystemName || (rawEntry.filesystem == window.PERSISTENT ? 'persistent' : 'temporary'));
    entry.nativeURL = rawEntry.nativeURL;

    return entry;
  }

  function injectCookieHandler(url, cb) {
    return function (response) {
      cookieHandler.setCookieFromString(url, resolveCookieString(response.headers));
      cb(response);
    }
  }

  function injectFileEntryHandler(cb) {
    return function (response) {
      cb(createFileEntry(response.file));
    }
  }

  function getCookieHeader(url) {
    return { Cookie: cookieHandler.getCookieString(url) };
  }

  function getMatchingHostHeaders(url, headersList) {
    var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    var domain = matches && matches[1];

    return headersList[domain] || null;
  }

  function getMergedHeaders(url, requestHeaders, predefinedHeaders) {
    var globalHeaders = predefinedHeaders['*'] || {};
    var hostHeaders = getMatchingHostHeaders(url, predefinedHeaders) || {};
    var mergedHeaders = mergeHeaders(globalHeaders, hostHeaders);

    mergedHeaders = mergeHeaders(mergedHeaders, requestHeaders);
    mergedHeaders = mergeHeaders(mergedHeaders, getCookieHeader(url));

    return mergedHeaders;
  }

  // typeof is not working reliably in JS
  function getTypeOf(object) {
    switch (Object.prototype.toString.call(object)) {
      case '[object Array]':
        return 'Array';
      case '[object Boolean]':
        return 'Boolean';
      case '[object Function]':
        return 'Function';
      case '[object Null]':
        return 'Null';
      case '[object Number]':
        return 'Number';
      case '[object Object]':
        return 'Object';
      case '[object String]':
        return 'String';
      case '[object Undefined]':
        return 'Undefined';
      default:
        return 'Unknown';
    }
  }

  function getAllowedDataTypes(dataSerializer) {
    switch (dataSerializer) {
      case 'utf8':
        return ['String'];
      case 'urlencoded':
        return ['Object'];
      default:
        return ['Array', 'Object'];
    }
  }

  function getProcessedData(data, dataSerializer) {
    var currentDataType = getTypeOf(data);
    var allowedDataTypes = getAllowedDataTypes(dataSerializer);

    if (allowedDataTypes.indexOf(currentDataType) === -1) {
      throw new Error(messages.DATA_TYPE_MISMATCH + ' ' + allowedDataTypes.join(', '));
    }

    if (dataSerializer === 'utf8') {
      data = { text: data };
    }

    return data;
  }

  function handleMissingCallbacks(successFn, failFn) {
    if (getTypeOf(successFn) !== 'Function') {
      throw new Error(messages.MANDATORY_SUCCESS);
    }

    if (getTypeOf(failFn) !== 'Function') {
      throw new Error(messages.MANDATORY_FAIL);
    }
  }

  function handleMissingOptions(options, globals) {
    options = options || {};

    return {
      method: checkHttpMethod(options.method || validHttpMethods[0]),
      serializer: checkSerializer(options.serializer || globals.serializer),
      timeout: checkTimeoutValue(options.timeout || globals.timeout),
      headers: checkHeadersObject(options.headers || {}),
      params: checkParamsObject(options.params || {}),
      data: getTypeOf(options.data) === 'Undefined' ? null : options.data,
      filePath: options.filePath || '',
      name: options.name || ''
    };
  }
};
