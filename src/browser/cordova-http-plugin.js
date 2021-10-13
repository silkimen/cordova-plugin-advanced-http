var pluginId = module.id.slice(0, module.id.lastIndexOf('.'));

var cordovaProxy = require('cordova/exec/proxy');
var jsUtil = require(pluginId + '.js-util');

var reqMap = {};

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
  return values.map(function (value) {
    return encodeURIComponent(key) + '[]=' + encodeURIComponent(value);
  }).join('&');
}

function serializeParams(params) {
  if (params === null) return '';

  return Object.keys(params).map(function (key) {
    if (jsUtil.getTypeOf(params[key]) === 'Array') {
      return serializeArray(key, params[key]);
    }

    return serializePrimitive(key, params[key]);
  }).join('&');
}

function decodeB64(dataString) {
  var binaryString = atob(dataString);
  var bytes = new Uint8Array(binaryString.length);

  for (var i = 0; i < binaryString.length; ++i) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

function processMultipartData(data) {
  if (!data) return null;

  var fd = new FormData();

  for (var i = 0; i < data.buffers.length; ++i) {
    var buffer = data.buffers[i];
    var name = data.names[i];
    var fileName = data.fileNames[i];
    var type = data.types[i];

    if (fileName) {
      fd.append(name, new Blob([decodeB64(buffer)], { type: type }), fileName);
    } else {
      // we assume it's plain text if no filename was given
      fd.append(name, atob(buffer));
    }
  }

  return fd;
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

function injectRequestIdHandler(reqId, cb) {
  return function (response) {
    delete reqMap[reqId];
    cb(response);
  }
}

function getHeaderValue(headers, headerName) {
  let result = null;

  Object.keys(headers).forEach(function (key) {
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
  Object.keys(headers).forEach(function (key) {
    if (key.toLowerCase() === 'cookie') return;

    xhr.setRequestHeader(key, headers[key]);
  });
}

function sendRequest(method, withData, opts, success, failure) {
  var data, serializer, headers, timeout, followRedirect, responseType, reqId;
  var url = opts[0];

  if (withData) {
    data = opts[1];
    serializer = opts[2];
    headers = opts[3];
    timeout = opts[4];
    // ignore opts[5] (read timeout)
    followRedirect = opts[6];
    responseType = opts[7];
    reqId = opts[8];
  } else {
    headers = opts[1];
    timeout = opts[2];
    // ignore opts[3] (read timeout)
    followRedirect = opts[4];
    responseType = opts[5];
    reqId = opts[6];
  }

  var onSuccess = injectRequestIdHandler(reqId, success);
  var onFail = injectRequestIdHandler(reqId, failure);

  var processedData = null;
  var xhr = new XMLHttpRequest();

  reqMap[reqId] = xhr;

  xhr.open(method, url);

  if (headers.Cookie && headers.Cookie.length > 0) {
    return onFail('advanced-http: custom cookies not supported on browser platform');
  }

  if (!followRedirect) {
    return onFail('advanced-http: disabling follow redirect not supported on browser platform');
  }

  switch (serializer) {
    case 'json':
      setDefaultContentType(headers, 'application/json; charset=utf8');
      processedData = serializeJsonData(data);

      if (processedData === null) {
        return onFail('advanced-http: failed serializing data');
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

    case 'multipart':
      const contentType = getHeaderValue(headers, 'Content-Type');

      // intentionally don't set a default content type
      // it's set by the browser together with the content disposition string
      if (contentType) {
        headers['Content-Type'] = contentType;
      }

      processedData = processMultipartData(data);
      break;

    case 'raw':
      setDefaultContentType(headers, 'application/octet-stream');
      processedData = data;
      break;
  }

  // requesting text instead of JSON because it's parsed in the response handler
  xhr.responseType = responseType === 'json' ? 'text' : responseType;
  xhr.timeout = timeout * 1000;
  setHeaders(xhr, headers);

  xhr.onerror = function () {
    return onFail(createXhrFailureObject(xhr));
  };

  xhr.onabort = function () {
    return onFail({
      status: -8,
      error: 'Request was aborted',
      url: url,
      headers: {}
    });
  };

  xhr.ontimeout = function () {
    return onFail({
      status: -4,
      error: 'Request timed out',
      url: url,
      headers: {}
    });
  };

  xhr.onload = function () {
    if (xhr.readyState !== xhr.DONE) return;

    if (xhr.status < 200 || xhr.status > 299) {
      return onFail(createXhrFailureObject(xhr));
    }

    return onSuccess(createXhrSuccessObject(xhr));
  };

  xhr.send(processedData);
}

function abort(opts, success, failure) {
  var reqId = opts[0];
  var result = false;

  var xhr = reqMap[reqId];
  if(xhr && xhr.readyState !== xhr.DONE){
    xhr.abort();
    result = true;
  }

  success({aborted: result});
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
  abort: function (success, failure, opts) {
    return abort(opts, success, failure);
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
