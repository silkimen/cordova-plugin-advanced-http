var pluginId = module.id.slice(0, module.id.lastIndexOf('.'));

var cordovaProxy = require('cordova/exec/proxy');
var helpers = require(pluginId + '.helpers');

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
    if (helpers.getTypeOf(params[key]) === 'Array') {
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

function createXhrSuccessObject(xhr) {
  return {
    url: xhr.responseURL,
    status: xhr.status,
    data: helpers.getTypeOf(xhr.responseText) === 'String' ? xhr.responseText : xhr.response,
    headers: deserializeResponseHeaders(xhr.getAllResponseHeaders())
  };
}

function createXhrFailureObject(xhr) {
  var obj = {};

  obj.headers = xhr.getAllResponseHeaders();
  obj.error = helpers.getTypeOf(xhr.responseText) === 'String' ? xhr.responseText : xhr.response;
  obj.error = obj.error || 'advanced-http: please check browser console for error messages';

  if (xhr.responseURL) obj.url = xhr.responseURL;
  if (xhr.status) obj.status = xhr.status;

  return obj;
}

function setHeaders(xhr, headers) {
  Object.keys(headers).forEach(function(key) {
    if (key === 'Cookie') return;

    xhr.setRequestHeader(key, headers[key]);
  });
}

function sendRequest(method, withData, opts, success, failure) {
  var data = withData ? opts[1] : null;
  var params = withData ? null : serializeParams(opts[1]);
  var serializer = withData ? opts[2] : null;
  var headers = withData ? opts[3] : opts[2];
  var timeout = withData ? opts[4] : opts[3];
  var url = params ? opts[0] + '?' + params : opts[0];

  var processedData = null;
  var xhr = new XMLHttpRequest();

  xhr.open(method, url);

  if (headers.Cookie && headers.Cookie.length > 0) {
    return failure('advanced-http: custom cookies not supported on browser platform');
  }

  switch (serializer) {
    case 'json':
      xhr.setRequestHeader('Content-Type', 'application/json; charset=utf8');
      processedData = serializeJsonData(data);

      if (processedData === null) {
        return failure('advanced-http: failed serializing data');
      }

      break;

    case 'utf8':
      xhr.setRequestHeader('Content-Type', 'text/plain; charset=utf8');
      processedData = data.text;
      break;

    case 'urlencoded':
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      processedData = serializeParams(data);
      break;
  }

  xhr.timeout = timeout * 1000;
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
  post: function (success, failure, opts) {
    return sendRequest('post', true, opts, success, failure);
  },
  get: function (success, failure, opts) {
    return sendRequest('get', false, opts, success, failure);
  },
  put: function (success, failure, opts) {
    return sendRequest('put', true, opts, success, failure);
  },
  patch: function (success, failure, opts) {
    return sendRequest('patch', true, opts, success, failure);
  },
  delete: function (success, failure, opts) {
    return sendRequest('delete', false, opts, success, failure);
  },
  head: function (success, failure, opts) {
    return sendRequest('head', false, opts, success, failure);
  },
  uploadFiles: function (success, failure, opts) {
    return failure('advanced-http: function "uploadFiles" not supported on browser platform');
  },
  downloadFile: function (success, failure, opts) {
    return failure('advanced-http: function "downloadFile" not supported on browser platform');
  },
  enableSSLPinning: function (success, failure, opts) {
    return failure('advanced-http: function "enableSSLPinning" not supported on browser platform');
  },
  acceptAllCerts: function (success, failure, opts) {
    return failure('advanced-http: function "acceptAllCerts" not supported on browser platform');
  },
  disableRedirect: function (success, failure, opts) {
    return failure('advanced-http: function "disableRedirect" not supported on browser platform');
  }
};

module.exports = browserInterface;
cordovaProxy.add('CordovaHttpPlugin', browserInterface);
