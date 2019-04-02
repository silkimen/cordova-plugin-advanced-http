module.exports = function init(helpers) {
  return {
    parseUrl: parseUrl,
    serializeQueryParams: serializeQueryParams,
    appendQueryParamsString: appendQueryParamsString
  }

  function parseUrl(url) {
    var match = url.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);

    return match && {
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4] || '',
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
  }

  function serializeQueryParams(params, encode) {
    return serializeObject(params, encode);
  }

  function serializeObject(object, encode) {
    var fragments = [];

    for (var key in object) {
      if (!object.hasOwnProperty(key)) {
        continue;
      }

      if (helpers.getTypeOf(object[key]) === 'Array') {
        fragments.push(serializeArray(object[key], encode));
        continue;
      } else if (helpers.getTypeOf(object[key]) === 'Object') {
        fragments.push(serializeObject(object[key], encode));
        continue;
      }

      if (encode) {
        fragments.push(encodeURIComponent(key) + '=' + encodeURIComponent(object[key]));
      } else {
        fragments.push(key + '=' + object[key]);
      }
    }

    return fragments.join('&');
  }

  function serializeArray(array, encode) {

  }

  function appendQueryParamsString(url, params) {
    if (!url.length || !params.length) {
      return url;
    }

    var parsed = parseUrl(url);

    return parsed.protocol
      + '//'
      + parsed.host
      + parsed.pathname
      + (parsed.search.length ? parsed.search + '&' + params : '?' + params)
      + parsed.hash;
  }
};

