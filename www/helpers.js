var pluginId = module.id.slice(0, module.id.lastIndexOf('.'));
var cookieHandler = require(pluginId + '.cookie-handler');
var messages = require(pluginId + '.messages');

var validSerializers = ['urlencoded', 'json', 'utf8' ];

module.exports = {
  b64EncodeUnicode: b64EncodeUnicode,
  checkHeaders: checkHeaders,
  onInvalidHeader: onInvalidHeader,
  checkSerializer: checkSerializer,
  injectCookieHandler: injectCookieHandler,
  injectFileEntryHandler: injectFileEntryHandler,
  getMergedHeaders: getMergedHeaders,
  getProcessedData: getProcessedData,
  handleMissingCallbacks: handleMissingCallbacks
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

function checkHeaders(headers) {
  var keys = Object.keys(headers);
  var key;

  for (var i = 0; i < keys.length; i++) {
    key = keys[i];

    if (typeof headers[key] !== 'string') {
      return false;
    }
  }

  return true;
}

function onInvalidHeader(handler) {
  handler({
    status: 0,
    error: messages.HEADER_VALUE_MUST_BE_STRING,
    headers: {}
  });
}

function checkSerializer(serializer) {
  serializer = serializer || '';
  serializer = serializer.trim().toLowerCase();

  if (validSerializers.indexOf(serializer) > -1) {
    return serializer;
  }

  return serializer[0];
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
  return function(response) {
    cookieHandler.setCookieFromString(url, resolveCookieString(response.headers));
    cb(response);
  }
}

function injectFileEntryHandler(cb) {
  return function(response) {
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
  data = data || {};

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
