var pluginId = module.id.slice(0, module.id.indexOf('.'));
var ToughCookie = require(pluginId + '.tough-cookie');
var WebStorageCookieStore = require(pluginId + '.local-storage-store');

var storage = window.localStorage;
var storeKey = '__advancedHttpCookieStore__';

var store = new WebStorageCookieStore(storage, storeKey);
var cookieJar = new ToughCookie.CookieJar(store);

module.exports = {
    setCookieFromString: setCookieFromString,
    getCookieString: getCookieString,
    clearCookies: clearCookies,
    removeCookies: removeCookies
}

function splitCookieString(cookieStr) {
    var cookieParts = cookieStr.split(',');
    var splitCookies = [];
    var processedCookie = null;

    for (var i = 0; i < cookieParts.length; ++i) {
        if (cookieParts[i].substr(-11, 8) === 'expires=' || 'Expires=') {
            processedCookie = cookieParts[i] + ',' + cookieParts[i + 1];
            i++;
        } else {
            processedCookie = cookieParts[i];
        }

        processedCookie = processedCookie.trim();
        splitCookies.push(processedCookie);
    }

    return splitCookies;
}

function setCookieFromString(url, cookieStr) {
    if (!cookieStr) return;

    var cookies = splitCookieString(cookieStr);

    for (var i = 0; i < cookies.length; ++i) {
        cookieJar.setCookieSync(cookies[i], url);
    }
}

function getCookieString(url) {
    return cookieJar.getCookieStringSync(url);
}

function clearCookies() {
    window.localStorage.removeItem(storeKey);
}

function removeCookies(url, cb) {
    cookieJar.getCookies(url, function(error, cookies) {
        if (!cookies || cookies.length === 0) {
        return cb(null, []);
        }

        var domain = cookies[0].domain;

        cookieJar.store.removeCookies(domain, null, cb);
    });
}
