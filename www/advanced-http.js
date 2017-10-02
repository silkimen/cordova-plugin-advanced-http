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
 * Modified by Sefa Ilkimen:
 *  - added configurable params serializer
 *  - added put and delete methods
 *  - using cordova www module pattern
 *  - some minor improvements
 *
*/

/*
 * An HTTP Plugin for PhoneGap.
 */

var pluginId = module.id.slice(0, module.id.indexOf('.'));
var validSerializers = ['urlencoded', 'json'];

var exec = require('cordova/exec');
var angularIntegration = require(pluginId +'.angular-integration');
var cookieHandler = require(pluginId + '.cookie-handler');

// Thanks Mozilla: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_.22Unicode_Problem.22
function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function mergeHeaders(globalHeaders, localHeaders) {
    var globalKeys = Object.keys(globalHeaders);
    var key;

    for (var i = 0; i < globalKeys.length; i++) {
        key = globalKeys[i];

        if (!localHeaders.hasOwnProperty(key)) {
            localHeaders[key] = globalHeaders[key];
        }
    }

    return localHeaders;
}

function checkSerializer(serializer) {
    serializer = serializer || '';
    serializer = serializer.trim().toLowerCase();

    if (validSerializers.indexOf(serializer) > -1) {
        return serializer;
    }

    return serializer[0];
}

function resolveCookieString(headers) {
    var keys = Object.keys(headers || {});

    for (var i = 0; i < keys.length; ++i) {
        if (keys[i].match(/^set-cookie$/i)) {
            return headers[keys[i]];
        }
    }

    return null;
}

function createFileEntry(rawEntry) {
    var entry = new (require('cordova-plugin-file.FileEntry'))();

    entry.isDirectory = rawEntry.isDirectory;
    entry.isFile = rawEntry.isFile;
    entry.name = rawEntry.name;
    entry.fullPath = rawEntry.fullPath;
    entry.filesystem = new FileSystem(rawEntry.filesystemName || (rawEntry.filesystem == window.PERSISTENT ? 'persistent' : 'temporary'));
    entry.nativeURL = rawEntry.nativeURL;

    return entry;
}

function injectCookieHandler(url, cb) {
    return function(response) {
        cookieHandler.setCookieFromString(url, resolveCookieString(response.headers));
        cb(response);
    }
}

function injectFileEntryHandler(cb) {
    return function(response) {
        cb(createFileEntry(response.file));
    }
}

function getCookieHeader(url) {
    return { Cookie: cookieHandler.getCookieString(url) };
}

function handleMissingCallbacks(successFn, failFn) {
    if (Object.prototype.toString.call(successFn) !== '[object Function]') {
        throw new Error('advanced-http: missing mandatory "onSuccess" callback function');
    }

    if (Object.prototype.toString.call(failFn) !== '[object Function]') {
        throw new Error('advanced-http: missing mandatory "onFail" callback function');
    }
}

var http = {
    headers: {},
    dataSerializer: 'urlencoded',
    sslPinning: false,
    timeoutInSeconds: 60.0,
    getBasicAuthHeader: function (username, password) {
        return {'Authorization': 'Basic ' + b64EncodeUnicode(username + ':' + password)};
    },
    useBasicAuth: function (username, password) {
        this.headers.Authorization = 'Basic ' + b64EncodeUnicode(username + ':' + password);
    },
    setHeader: function (header, value) {
        this.headers[header] = value;
    },
    setDataSerializer: function (serializer) {
        this.dataSerializer = checkSerializer(serializer);
    },
    clearCookies: function () {
        return cookieHandler.clearCookies();
    },
    removeCookies: function (url, callback) {
        cookieHandler.removeCookies(url, callback);
    },
    setRequestTimeout: function(timeout) {
        this.timeoutInSeconds = timeout;
    },
    enableSSLPinning: function (enable, success, failure) {
        return exec(success, failure, 'CordovaHttpPlugin', 'enableSSLPinning', [enable]);
    },
    acceptAllCerts: function (allow, success, failure) {
        return exec(success, failure, 'CordovaHttpPlugin', 'acceptAllCerts', [allow]);
    },
    disableRedirect: function(disable, success, failure) {
        return exec(success, failure, "CordovaHttpPlugin", "disableRedirect", [disable]);
    },
    validateDomainName: function (validate, success, failure) {
        return exec(success, failure, 'CordovaHttpPlugin', 'validateDomainName', [validate]);
    },
    post: function (url, data, headers, success, failure) {
        handleMissingCallbacks(success, failure);

        data = data || {};
        headers = headers || {};
        headers = mergeHeaders(this.headers, headers);
        headers = mergeHeaders(getCookieHeader(url), headers);

        var onSuccess = injectCookieHandler(url, success);
        var onFail = injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'post', [url, data, this.dataSerializer, headers, this.timeoutInSeconds]);
    },
    get: function (url, params, headers, success, failure) {
        handleMissingCallbacks(success, failure);

        params = params || {};
        headers = headers || {};
        headers = mergeHeaders(this.headers, headers);
        headers = mergeHeaders(getCookieHeader(url), headers);

        var onSuccess = injectCookieHandler(url, success);
        var onFail = injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'get', [url, params, headers, this.timeoutInSeconds]);
    },
    put: function (url, data, headers, success, failure) {
        handleMissingCallbacks(success, failure);

        data = data || {};
        headers = headers || {};
        headers = mergeHeaders(this.headers, headers);
        headers = mergeHeaders(getCookieHeader(url), headers);

        var onSuccess = injectCookieHandler(url, success);
        var onFail = injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'put', [url, data, this.dataSerializer, headers, this.timeoutInSeconds]);
    },
/*
 * Disabled because PATCH method is not implemented for iOS
 *
    patch: function (url, data, headers, success, failure) {
        handleMissingCallbacks(success, failure);

        data = data || {};
        headers = headers || {};
        headers = mergeHeaders(this.headers, headers);
        headers = mergeHeaders(getCookieHeader(url), headers);

        var onSuccess = injectCookieHandler(url, success);
        var onFail = injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'patch', [url, data, this.dataSerializer, headers]);
    },
*/
    delete: function (url, params, headers, success, failure) {
        handleMissingCallbacks(success, failure);

        params = params || {};
        headers = headers || {};
        headers = mergeHeaders(this.headers, headers);
        headers = mergeHeaders(getCookieHeader(url), headers);

        var onSuccess = injectCookieHandler(url, success);
        var onFail = injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'delete', [url, params, headers, this.timeoutInSeconds]);
    },
    head: function (url, params, headers, success, failure) {
        handleMissingCallbacks(success, failure);

        params = params || {};
        headers = headers || {};
        headers = mergeHeaders(this.headers, headers);
        headers = mergeHeaders(getCookieHeader(url), headers);

        var onSuccess = injectCookieHandler(url, success);
        var onFail = injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'head', [url, params, headers, this.timeoutInSeconds]);
    },
    uploadFile: function (url, params, headers, filePath, name, success, failure) {
        handleMissingCallbacks(success, failure);

        params = params || {};
        headers = headers || {};
        headers = mergeHeaders(this.headers, headers);
        headers = mergeHeaders(getCookieHeader(url), headers);

        var onSuccess = injectCookieHandler(url, success);
        var onFail = injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'uploadFile', [url, params, headers, filePath, name, this.timeoutInSeconds]);
    },
    downloadFile: function (url, params, headers, filePath, success, failure) {
        handleMissingCallbacks(success, failure);

        params = params || {};
        headers = headers || {};
        headers = mergeHeaders(this.headers, headers);
        headers = mergeHeaders(getCookieHeader(url), headers);

        var onSuccess = injectCookieHandler(url, injectFileEntryHandler(success));
        var onFail = injectCookieHandler(url, failure);

        return exec(onSuccess, onFail, 'CordovaHttpPlugin', 'downloadFile', [url, params, headers, filePath, this.timeoutInSeconds]);
    }
};

angularIntegration.registerService(http);
module.exports = http;
