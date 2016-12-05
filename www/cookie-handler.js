var pluginId = module.id.slice(0, module.id.indexOf('.'));
var ToughCookie = require(pluginId + '.tough-cookie');
var cookieJar = new ToughCookie.CookieJar();

module.exports = {
    setCookie: setCookie,
    getCookie: getCookie
}

function setCookie(url, cookieStr) {
    if (!cookieStr) return;
    cookieJar.setCookieSync(cookieStr, url);
}

function getCookie(url) {
    return cookieJar.getCookieStringSync(url);
}
