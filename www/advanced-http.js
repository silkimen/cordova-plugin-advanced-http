/*global angular*/

/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 * Modified by Andrew Stephan for Sync OnSet
 * Modified by Sefa Ilkimen
*/

/*
 * An HTTP Plugin for PhoneGap.
 */

var pluginId = module.id.slice(0, module.id.lastIndexOf('.'));

var exec = require('cordova/exec');
var angularIntegration = require(pluginId +'.angular-integration');
var cookieHandler = require(pluginId + '.cookie-handler');
var helpers = require(pluginId + '.helpers');
var messages = require(pluginId + '.messages');

var internals = {
  headers: {},
  dataSerializer: 'urlencoded',
  timeoutInSeconds: 60.0,
};

var publicInterface = {
    getBasicAuthHeader: function (username, password) {
        return {'Authorization': 'Basic ' + helpers.b64EncodeUnicode(username + ':' + password)};
    },
    useBasicAuth: function (username, password) {
        this.setHeader('*', 'Authorization', 'Basic ' + helpers.b64EncodeUnicode(username + ':' + password));
    },
    getHeaders: function (host) {
        return internals.headers[host || '*'] || null;
    },
    setHeader: function () {
        // this one is for being backward compatible
        var host = '*';
        var header = arguments[0];
        var value = arguments[1];

        if (arguments.length === 3) {
            host = arguments[0];
            header = arguments[1];
            value = arguments[2];
        }

        if (header.toLowerCase() === 'cookie') {
          throw new Error(messages.ADDING_COOKIES_NOT_SUPPORTED);
        }

        if (helpers.getTypeOf(value) !== 'String') {
          throw new Error(messages.HEADER_VALUE_MUST_BE_STRING);
        }

        internals.headers[host] = internals.headers[host] || {};
        internals.headers[host][header] = value;
    },
    getDataSerializer: function () {
        return internals.dataSerializer;
    },
    setDataSerializer: function (serializer) {
        internals.dataSerializer = helpers.checkSerializer(serializer);
    },
    setCookie: function (url, cookie, options) {
        cookieHandler.setCookie(url, cookie, options);
    },
    clearCookies: function () {
        cookieHandler.clearCookies();
    },
    removeCookies: function (url, callback) {
        cookieHandler.removeCookies(url, callback);
    },
    getCookieString: function (url) {
        return cookieHandler.getCookieString(url);
    },
    getRequestTimeout: function () {
        return internals.timeoutInSeconds;
    },
    setRequestTimeout: function (timeout) {
        internals.timeoutInSeconds = timeout;
    },
    enableSSLPinning: function (enable, success, failure) {
        return exec(success, failure, 'CordovaHttpPlugin', 'enableSSLPinning', [enable]);
    },
    addPinningCerts: function(certs, success, failure) {
        return exec(success, failure, "CordovaHttpPlugin", "addPinningCerts", [certs]);
    },
    acceptAllCerts: function (allow, success, failure) {
        return exec(success, failure, 'CordovaHttpPlugin', 'acceptAllCerts', [allow]);
    },
    disableRedirect: function (disable, success, failure) {
        return exec(success, failure, 'CordovaHttpPlugin', 'disableRedirect', [disable]);
    },
    validateDomainName: function (validate, success, failure) {
        failure(messages.DEPRECATED_VDN);
    },
    post: function (url, data, headers, success, failure) {
        helpers.handleMissingCallbacks(success, failure);

        data = helpers.getProcessedData(data, internals.dataSerializer);
        headers = helpers.getMergedHeaders(url, headers, internals.headers);

        if (!helpers.checkHeaders(headers)) {
          return helpers.onInvalidHeader(failure);
        }

        var onSuccess = helpers.injectCookieHandler(url, success);
        var onFail = helpers.injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'post', [url, data, internals.dataSerializer, headers, internals.timeoutInSeconds]);
    },
    get: function (url, params, headers, success, failure) {
        helpers.handleMissingCallbacks(success, failure);

        params = params || {};
        headers = helpers.getMergedHeaders(url, headers, internals.headers);

        if (!helpers.checkHeaders(headers)) {
          return helpers.onInvalidHeader(failure);
        }

        var onSuccess = helpers.injectCookieHandler(url, success);
        var onFail = helpers.injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'get', [url, params, headers, internals.timeoutInSeconds]);
    },
    put: function (url, data, headers, success, failure) {
        helpers.handleMissingCallbacks(success, failure);

        data = helpers.getProcessedData(data, internals.dataSerializer);
        headers = helpers.getMergedHeaders(url, headers, internals.headers);

        if (!helpers.checkHeaders(headers)) {
          return helpers.onInvalidHeader(failure);
        }

        var onSuccess = helpers.injectCookieHandler(url, success);
        var onFail = helpers.injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'put', [url, data, internals.dataSerializer, headers, internals.timeoutInSeconds]);
    },

    patch: function (url, data, headers, success, failure) {
        helpers.handleMissingCallbacks(success, failure);

        data = helpers.getProcessedData(data, internals.dataSerializer);
        headers = helpers.getMergedHeaders(url, headers, internals.headers);

        if (!helpers.checkHeaders(headers)) {
          return helpers.onInvalidHeader(failure);
        }

        var onSuccess = helpers.injectCookieHandler(url, success);
        var onFail = helpers.injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'patch', [url, data, internals.dataSerializer, headers, internals.timeoutInSeconds]);
    },

    delete: function (url, params, headers, success, failure) {
        helpers.handleMissingCallbacks(success, failure);

        params = params || {};
        headers = helpers.getMergedHeaders(url, headers, internals.headers);

        if (!helpers.checkHeaders(headers)) {
          return helpers.onInvalidHeader(failure);
        }

        var onSuccess = helpers.injectCookieHandler(url, success);
        var onFail = helpers.injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'delete', [url, params, headers, internals.timeoutInSeconds]);
    },
    head: function (url, params, headers, success, failure) {
        helpers.handleMissingCallbacks(success, failure);

        params = params || {};
        headers = helpers.getMergedHeaders(url, headers, internals.headers);

        if (!helpers.checkHeaders(headers)) {
          return helpers.onInvalidHeader(failure);
        }

        var onSuccess = helpers.injectCookieHandler(url, success);
        var onFail = helpers.injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'head', [url, params, headers, internals.timeoutInSeconds]);
    },
    uploadFile: function (url, params, headers, filePath, name, success, failure) {
        helpers.handleMissingCallbacks(success, failure);

        params = params || {};
        headers = helpers.getMergedHeaders(url, headers, internals.headers);

        if (!helpers.checkHeaders(headers)) {
          return helpers.onInvalidHeader(failure);
        }

        var onSuccess = helpers.injectCookieHandler(url, success);
        var onFail = helpers.injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'uploadFile', [url, params, headers, filePath, name, internals.timeoutInSeconds]);
    },
    downloadFile: function (url, params, headers, filePath, success, failure) {
        helpers.handleMissingCallbacks(success, failure);

        params = params || {};
        headers = helpers.getMergedHeaders(url, headers, internals.headers);

        if (!helpers.checkHeaders(headers)) {
          return helpers.onInvalidHeader(failure);
        }

        var onSuccess = helpers.injectCookieHandler(url, helpers.injectFileEntryHandler(success));
        var onFail = helpers.injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'downloadFile', [url, params, headers, filePath, internals.timeoutInSeconds]);
    }
};

angularIntegration.registerService(publicInterface);
module.exports = publicInterface;
