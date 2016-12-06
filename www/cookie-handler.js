var pluginId = module.id.slice(0, module.id.indexOf('.'));
var ToughCookie = require(pluginId + '.tough-cookie');
var WebStorageCookieStore = require(pluginId + '.local-storage-store');

var storage = window.localStorage;
var storeKey = '__advancedHttpCookieStore__';

var store = new WebStorageCookieStore(storage, storeKey);
var cookieJar = new ToughCookie.CookieJar(store);

module.exports = {
    setCookie: setCookie,
    getCookie: getCookie,
    clearCookies: clearCookies
}

function setCookie(url, cookieStr) {
    if (!cookieStr) return;
    cookieJar.setCookieSync(cookieStr, url);
}

function getCookie(url) {
    return cookieJar.getCookieStringSync(url);
}

function clearCookies() {
    window.localStorage.removeItem(storeKey);
}
