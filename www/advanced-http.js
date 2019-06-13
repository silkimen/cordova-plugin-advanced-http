/*
 * A native HTTP Plugin for Cordova / PhoneGap.
 */

var pluginId = module.id.slice(0, module.id.lastIndexOf('.'));

var exec = require('cordova/exec');
var base64 = require('cordova/base64');
var messages = require(pluginId + '.messages');
var globalConfigs = require(pluginId + '.global-configs');
var jsUtil = require(pluginId + '.js-util');
var ToughCookie = require(pluginId + '.tough-cookie');
var lodash = require(pluginId + '.lodash');
var WebStorageCookieStore = require(pluginId + '.local-storage-store')(ToughCookie, lodash);
var cookieHandler = require(pluginId + '.cookie-handler')(window.localStorage, ToughCookie, WebStorageCookieStore);
var helpers = require(pluginId + '.helpers')(jsUtil, cookieHandler, messages, base64);
var urlUtil = require(pluginId + '.url-util')(jsUtil);
var publicInterface = require(pluginId + '.public-interface')(exec, cookieHandler, urlUtil, helpers, globalConfigs);

module.exports = publicInterface;
