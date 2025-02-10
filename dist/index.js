var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { IonicNativePlugin, cordova, cordovaPropertyGet, cordovaPropertySet } from '@ionic-native/core';
var HTTPOriginal = /** @class */ (function (_super) {
    __extends(HTTPOriginal, _super);
    function HTTPOriginal() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HTTPOriginal.prototype.getBasicAuthHeader = function (username, password) { return cordova(this, "getBasicAuthHeader", { "sync": true }, arguments); };
    HTTPOriginal.prototype.useBasicAuth = function (username, password) { return cordova(this, "useBasicAuth", { "sync": true }, arguments); };
    HTTPOriginal.prototype.getHeaders = function (host) { return cordova(this, "getHeaders", { "sync": true }, arguments); };
    HTTPOriginal.prototype.setHeader = function (host, header, value) { return cordova(this, "setHeader", { "sync": true }, arguments); };
    HTTPOriginal.prototype.getDataSerializer = function () { return cordova(this, "getDataSerializer", { "sync": true }, arguments); };
    HTTPOriginal.prototype.setDataSerializer = function (serializer) { return cordova(this, "setDataSerializer", { "sync": true }, arguments); };
    HTTPOriginal.prototype.setCookie = function (url, cookie) { return cordova(this, "setCookie", { "sync": true }, arguments); };
    HTTPOriginal.prototype.clearCookies = function () { return cordova(this, "clearCookies", { "sync": true }, arguments); };
    HTTPOriginal.prototype.removeCookies = function (url, cb) { return cordova(this, "removeCookies", { "sync": true }, arguments); };
    HTTPOriginal.prototype.getCookieString = function (url) { return cordova(this, "getCookieString", { "sync": true }, arguments); };
    HTTPOriginal.prototype.getRequestTimeout = function () { return cordova(this, "getRequestTimeout", { "sync": true }, arguments); };
    HTTPOriginal.prototype.setRequestTimeout = function (timeout) { return cordova(this, "setRequestTimeout", { "sync": true }, arguments); };
    HTTPOriginal.prototype.getFollowRedirect = function () { return cordova(this, "getFollowRedirect", { "sync": true }, arguments); };
    HTTPOriginal.prototype.setFollowRedirect = function (follow) { return cordova(this, "setFollowRedirect", { "sync": true }, arguments); };
    HTTPOriginal.prototype.setServerTrustMode = function (mode) { return cordova(this, "setServerTrustMode", {}, arguments); };
    HTTPOriginal.prototype.post = function (url, body, headers) { return cordova(this, "post", {}, arguments); };
    HTTPOriginal.prototype.postSync = function (url, body, headers, success, failure) { return cordova(this, "post", { "methodName": "post", "sync": true }, arguments); };
    HTTPOriginal.prototype.get = function (url, parameters, headers) { return cordova(this, "get", {}, arguments); };
    HTTPOriginal.prototype.getSync = function (url, parameters, headers, success, failure) { return cordova(this, "get", { "methodName": "get", "sync": true }, arguments); };
    HTTPOriginal.prototype.put = function (url, body, headers) { return cordova(this, "put", {}, arguments); };
    HTTPOriginal.prototype.putSync = function (url, body, headers, success, failure) { return cordova(this, "put", { "methodName": "put", "sync": true }, arguments); };
    HTTPOriginal.prototype.patch = function (url, body, headers) { return cordova(this, "patch", {}, arguments); };
    HTTPOriginal.prototype.patchSync = function (url, body, headers, success, failure) { return cordova(this, "patch", { "methodName": "patch", "sync": true }, arguments); };
    HTTPOriginal.prototype.delete = function (url, parameters, headers) { return cordova(this, "delete", {}, arguments); };
    HTTPOriginal.prototype.deleteSync = function (url, parameters, headers, success, failure) { return cordova(this, "delete", { "methodName": "delete", "sync": true }, arguments); };
    HTTPOriginal.prototype.head = function (url, parameters, headers) { return cordova(this, "head", {}, arguments); };
    HTTPOriginal.prototype.headSync = function (url, parameters, headers, success, failure) { return cordova(this, "head", { "methodName": "head", "sync": true }, arguments); };
    HTTPOriginal.prototype.options = function (url, parameters, headers) { return cordova(this, "options", {}, arguments); };
    HTTPOriginal.prototype.optionsSync = function (url, parameters, headers, success, failure) { return cordova(this, "options", { "methodName": "options", "sync": true }, arguments); };
    HTTPOriginal.prototype.uploadFile = function (url, body, headers, filePath, name) { return cordova(this, "uploadFile", {}, arguments); };
    HTTPOriginal.prototype.uploadFileSync = function (url, body, headers, filePath, name, success, failure) { return cordova(this, "uploadFile", { "methodName": "uploadFile", "sync": true }, arguments); };
    HTTPOriginal.prototype.downloadFile = function (url, body, headers, filePath) { return cordova(this, "downloadFile", {}, arguments); };
    HTTPOriginal.prototype.downloadFileSync = function (url, body, headers, filePath, success, failure) { return cordova(this, "downloadFile", { "methodName": "downloadFile", "sync": true }, arguments); };
    HTTPOriginal.prototype.sendRequest = function (url, options) { return cordova(this, "sendRequest", {}, arguments); };
    HTTPOriginal.prototype.sendRequestSync = function (url, options, success, failure) { return cordova(this, "sendRequest", { "methodName": "sendRequest", "sync": true }, arguments); };
    HTTPOriginal.prototype.abort = function (requestId) { return cordova(this, "abort", {}, arguments); };
    Object.defineProperty(HTTPOriginal.prototype, "ErrorCode", {
        get: function () { return cordovaPropertyGet(this, "ErrorCode"); },
        set: function (value) { cordovaPropertySet(this, "ErrorCode", value); },
        enumerable: false,
        configurable: true
    });
    HTTPOriginal.pluginName = "HTTP";
    HTTPOriginal.plugin = "cordova-plugin-advanced-http";
    HTTPOriginal.pluginRef = "cordova.plugin.http";
    HTTPOriginal.repo = "https://github.com/silkimen/cordova-plugin-advanced-http";
    HTTPOriginal.platforms = ["Android", "iOS"];
    return HTTPOriginal;
}(IonicNativePlugin));
var HTTP = new HTTPOriginal();
export { HTTP };