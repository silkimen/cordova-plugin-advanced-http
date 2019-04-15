module.exports = function init(jsUtil, cookieHandler, messages) {
  var validSerializers = ['urlencoded', 'json', 'utf8'];
  var validCertModes = ['default', 'nocheck', 'pinned', 'legacy'];
  var validClientAuthModes = ['none', 'systemstore', 'buffer'];
  var validHttpMethods = ['get', 'put', 'post', 'patch', 'head', 'delete', 'upload', 'download'];

  var interface = {
    b64EncodeUnicode: b64EncodeUnicode,
    checkSerializer: checkSerializer,
    checkSSLCertMode: checkSSLCertMode,
    checkClientAuthMode: checkClientAuthMode,
    checkClientAuthOptions: checkClientAuthOptions,
    checkForBlacklistedHeaderKey: checkForBlacklistedHeaderKey,
    checkForInvalidHeaderValue: checkForInvalidHeaderValue,
    injectCookieHandler: injectCookieHandler,
    injectFileEntryHandler: injectFileEntryHandler,
    getMergedHeaders: getMergedHeaders,
    getProcessedData: getProcessedData,
    handleMissingCallbacks: handleMissingCallbacks,
    handleMissingOptions: handleMissingOptions
  };

  // expose all functions for testing purposes
  if (init.debug) {
    interface.mergeHeaders = mergeHeaders;
    interface.checkForValidStringValue = checkForValidStringValue;
    interface.checkKeyValuePairObject = checkKeyValuePairObject;
    interface.checkHttpMethod = checkHttpMethod;
    interface.checkTimeoutValue = checkTimeoutValue;
    interface.checkHeadersObject = checkHeadersObject;
    interface.checkParamsObject = checkParamsObject;
    interface.resolveCookieString = resolveCookieString;
    interface.createFileEntry = createFileEntry;
    interface.getCookieHeader = getCookieHeader;
    interface.getMatchingHostHeaders = getMatchingHostHeaders;
    interface.getAllowedDataTypes = getAllowedDataTypes;
  }

  return interface;

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
    if (jsUtil.getTypeOf(value) !== 'String') {
      throw new Error(onInvalidValueMessage + ' ' + list.join(', '));
    }

    value = value.trim().toLowerCase();

    if (list.indexOf(value) === -1) {
      throw new Error(onInvalidValueMessage + ' ' + list.join(', '));
    }

    return value;
  }

  function checkKeyValuePairObject(obj, allowedChildren, onInvalidValueMessage) {
    if (jsUtil.getTypeOf(obj) !== 'Object') {
      throw new Error(onInvalidValueMessage);
    }

    var keys = Object.keys(obj);

    for (var i = 0; i < keys.length; i++) {
      if (allowedChildren.indexOf(jsUtil.getTypeOf(obj[keys[i]])) === -1) {
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

  function checkClientAuthOptions(mode, options) {
    options = options || {};

    // none
    if (mode === validClientAuthModes[0]) {
      return {
        alias: null,
        rawPkcs: null,
        pkcsPassword: ''
      };
    }

    if (jsUtil.getTypeOf(options) !== 'Object') {
      throw new Error(messages.INVALID_CLIENT_AUTH_OPTIONS);
    }

    // systemstore
    if (mode === validClientAuthModes[1]) {
      if (jsUtil.getTypeOf(options.alias) !== 'String'
        && jsUtil.getTypeOf(options.alias) !== 'Undefined') {
        throw new Error(messages.INVALID_CLIENT_AUTH_ALIAS);
      }

      return {
        alias: jsUtil.getTypeOf(options.alias) === 'Undefined' ? null : options.alias,
        rawPkcs: null,
        pkcsPassword: ''
      };
    }

    // buffer
    if (mode === validClientAuthModes[2]) {
      if (jsUtil.getTypeOf(options.rawPkcs) !== 'ArrayBuffer') {
        throw new Error(messages.INVALID_CLIENT_AUTH_RAW_PKCS);
      }

      if (jsUtil.getTypeOf(options.pkcsPassword) !== 'String') {
        throw new Error(messages.INVALID_CLIENT_AUTH_PKCS_PASSWORD);
      }

      return {
        alias: null,
        rawPkcs: options.rawPkcs,
        pkcsPassword: options.pkcsPassword
      }
    }
  }

  function checkForBlacklistedHeaderKey(key) {
    if (key.toLowerCase() === 'cookie') {
      throw new Error(messages.ADDING_COOKIES_NOT_SUPPORTED);
    }

    return key;
  }

  function checkForInvalidHeaderValue(value) {
    if (jsUtil.getTypeOf(value) !== 'String') {
      throw new Error(messages.INVALID_HEADERS_VALUE);
    }

    return value;
  }

  function checkTimeoutValue(timeout) {
    if (jsUtil.getTypeOf(timeout) !== 'Number' || timeout < 0) {
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
    var cookieString = cookieHandler.getCookieString(url);

    if (cookieString.length) {
      return { Cookie: cookieHandler.getCookieString(url) };
    }

    return {};
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
    var currentDataType = jsUtil.getTypeOf(data);
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
    if (jsUtil.getTypeOf(successFn) !== 'Function') {
      throw new Error(messages.MANDATORY_SUCCESS);
    }

    if (jsUtil.getTypeOf(failFn) !== 'Function') {
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
      data: jsUtil.getTypeOf(options.data) === 'Undefined' ? null : options.data,
      filePath: options.filePath || '',
      name: options.name || ''
    };
  }
};
