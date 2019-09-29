var pluginId = module.id.slice(0, module.id.lastIndexOf('.'));

var cordovaProxy = require('cordova/exec/proxy');
var jsUtil = require(pluginId + '.js-util');

function serializeJsonData(data) {
  try {
    return JSON.stringify(data);
  } catch (err) {
    return null;
  }
}

function serializePrimitive(key, value) {
  if (value === null || value === undefined) {
    return encodeURIComponent(key) + '=';
  }

  return encodeURIComponent(key) + '=' + encodeURIComponent(value);
}

function serializeArray(key, values) {
  return values.map(function(value) {
    return encodeURIComponent(key) + '[]=' + encodeURIComponent(value);
  }).join('&');
}

function serializeParams(params) {
  if (params === null) return '';

  return Object.keys(params).map(function(key) {
    if (jsUtil.getTypeOf(params[key]) === 'Array') {
      return serializeArray(key, params[key]);
    }

    return serializePrimitive(key, params[key]);
  }).join('&');
}

function deserializeResponseHeaders(headers) {
  var headerMap = {};
  var arr = headers.trim().split(/[\r\n]+/);

  arr.forEach(function (line) {
    var parts = line.split(': ');
    var header = parts.shift().toLowerCase();
    var value = parts.join(': ');

    headerMap[header] = value;
  });

  return headerMap;
}

function getResponseData(xhr) {
  if (xhr.responseType !== 'text' || jsUtil.getTypeOf(xhr.responseText) !== 'String') {
    return xhr.response;
  }

  return xhr.responseText;
}

function createXhrSuccessObject(xhr) {
  return {
    url: xhr.responseURL,
    status: xhr.status,
    data: getResponseData(xhr),
    headers: deserializeResponseHeaders(xhr.getAllResponseHeaders())
  };
}

function createXhrFailureObject(xhr) {
  var obj = {};

  obj.headers = xhr.getAllResponseHeaders();
  obj.error = getResponseData(xhr);
  obj.error = obj.error || 'advanced-http: please check browser console for error messages';

  if (xhr.responseURL) obj.url = xhr.responseURL;
  if (xhr.status) obj.status = xhr.status;

  return obj;
}

function getHeaderValue(headers, headerName) {
  let result = null;

  Object.keys(headers).forEach(function(key) {
    if (key.toLowerCase() === headerName.toLowerCase()) {
      result = headers[key];
    }
  });

  return result;
}

function setDefaultContentType(headers, contentType) {
  if (getHeaderValue(headers, 'Content-Type') === null) {
    headers['Content-Type'] = contentType;
  }
}

function setHeaders(xhr, headers) {
  Object.keys(headers).forEach(function(key) {
    if (key.toLowerCase() === 'cookie') return;

    xhr.setRequestHeader(key, headers[key]);
  });
}

function sendRequest(method, withData, opts, success, failure) {
  var data, serializer, headers, timeout, followRedirect, responseType;
  var url = opts[0];

  if (withData) {
    data = opts[1];
    serializer = opts[2];
    headers = opts[3];
    timeout = opts[4];
    followRedirect = opts[5];
    responseType = opts[6];
  } else {
    headers = opts[1];
    timeout = opts[2];
    followRedirect = opts[3];
    responseType = opts[4];

  }

  var processedData = null;
  var xhr = new XMLHttpRequest();

  xhr.open(method, url);

  if (headers.Cookie && headers.Cookie.length > 0) {
    return failure('advanced-http: custom cookies not supported on browser platform');
  }

  if (!followRedirect) {
    return failure('advanced-http: disabling follow redirect not supported on browser platform');
  }

  switch (serializer) {
    case 'json':
      setDefaultContentType(headers, 'application/json; charset=utf8');
      processedData = serializeJsonData(data);

      if (processedData === null) {
        return failure('advanced-http: failed serializing data');
      }

      break;

    case 'utf8':
      setDefaultContentType(headers, 'text/plain; charset=utf8');
      processedData = data.text;
      break;

    case 'urlencoded':
      setDefaultContentType(headers, 'application/x-www-form-urlencoded');
      processedData = serializeParams(data);
      break;
  }

  xhr.timeout = timeout * 1000;
  xhr.responseType = responseType;
  setHeaders(xhr, headers);

  xhr.onerror = xhr.ontimeout = function () {
    return failure(createXhrFailureObject(xhr));
  };

  xhr.onload = function () {
    if (xhr.readyState !== xhr.DONE) return;

    if (xhr.status < 200 || xhr.status > 299) {
      return failure(createXhrFailureObject(xhr));
    }

    return success(createXhrSuccessObject(xhr));
  };

  xhr.send(processedData);
}

var browserInterface = {
  get: function (success, failure, opts) {
    return sendRequest('get', false, opts, success, failure);
  },
  head: function (success, failure, opts) {
    return sendRequest('head', false, opts, success, failure);
  },
  delete: function (success, failure, opts) {
    return sendRequest('delete', false, opts, success, failure);
  },
  post: function (success, failure, opts) {
    return sendRequest('post', true, opts, success, failure);
  },
  put: function (success, failure, opts) {
    return sendRequest('put', true, opts, success, failure);
  },
  patch: function (success, failure, opts) {
    return sendRequest('patch', true, opts, success, failure);
  },
  uploadFile: function (success, failure, opts) {
    return failure('advanced-http: function "uploadFile" not supported on browser platform');
  },
  uploadFiles: function (success, failure, opts) {
    return failure('advanced-http: function "uploadFiles" not supported on browser platform');
  },
  downloadFile: function (success, failure, opts) {
    return failure('advanced-http: function "downloadFile" not supported on browser platform');
  },
  setServerTrustMode: function (success, failure, opts) {
    return failure('advanced-http: function "setServerTrustMode" not supported on browser platform');
  },
  setClientAuthMode: function (success, failure, opts) {
    return failure('advanced-http: function "setClientAuthMode" not supported on browser platform');
  }
};

module.exports = browserInterface;
cordovaProxy.add('CordovaHttpPlugin', browserInterface);
