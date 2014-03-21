/*global angular*/

/*
 * An HTTP Plugin for PhoneGap.
 */

var exec = require('cordova/exec');

var http = {
    SSLPinningMode: {
        None: 0,
        Certificate: 1,
        PublicKey: 2
    },
    setAuthorizationHeaderWithUsernameAndPassword: function(username, password, success, failure) {
        return exec(success, failure, "CordovaHTTP", "setAuthorizationHeaderWithUsernameAndPassword", [username, password]);
    },
    setHeader: function(header, value, success, failure) {
        return exec(success, failure, "CordovaHTTP", "setHeader", [header, value]);
    },
    setSSLPinningMode: function(mode, success, failure) {
        return exec(success, failure, "CordovaHTTP", "setSSLPinningMode", [mode]);
    },
    validateEntireCertificateChain: function(validateChain, success, failure) {
        return exec(success, failure, "CordovaHTTP", "validateEntireCertificateChain", [validateChain]);
    },
    allowInvalidCertificates: function(allow, success, failure) {
        return exec(success, failure, "CordovaHTTP", "allowInvalidCertificates", [allow]);
    },
    acceptText: function(success, failure) {
        return exec(success, failure, "CordovaHTTP", "acceptText", []);
    },
    acceptData: function(success, failure) {
        return exec(success, failure, "CordovaHTTP", "acceptData", []);
    },
    setAcceptableContentTypes: function(contentTypes, success, failure) {
        return exec(success, failure, "CordovaHTTP", "setAcceptableContentTypes", contentTypes);
    },
    post: function(url, params, headers, success, failure) {
        return exec(success, failure, "CordovaHTTP", "post", [url, params, headers]);
    },
    get: function(url, params, success, failure) {
        return exec(success, failure, "CordovaHTTP", "get", [url, params]);
    },
    uploadFile: function(url, params, filePath, name, success, failure) {
        return exec(success, failure, "CordovaHTTP", "uploadFile", [url, params, filePath, name]);
    },
    downloadFile: function(url, params, filePath, success, failure) {
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
         *
        */
        var win = function(result) {
            var entry = new (require('org.apache.cordova.file.FileEntry'))();
            entry.isDirectory = false;
            entry.isFile = true;
            entry.name = result.file.name;
            entry.fullPath = result.file.fullPath;
            success(entry);
        };
        return exec(win, failure, "CordovaHTTP", "downloadFile", [url, params, filePath]);
    }
};

if (angular) {
    angular.module('cordovaHTTP', []).factory('cordovaHTTP', function($timeout, $q) {
        function makePromise(fn, args, async) {
            var deferred = $q.defer();
            
            var success = function(response) {
                if (async) {
                    $timeout(function() {
                        deferred.resolve(response);
                    });
                } else {
                    deferred.resolve(response);
                }
            };
            
            var fail = function(response) {
                if (async) {
                    $timeout(function() {
                        deferred.reject(response);
                    });
                } else {
                    deferred.reject(response);
                }
            };
            
            args.push(success);
            args.push(fail);
            
            fn.apply(http, args);
            
            return deferred.promise;
        }
        
        var cordovaHTTP = {
            SSLPinningMode: http.SSLPinningMode,
            setAuthorizationHeaderWithUsernameAndPassword: function(username, password) {
                return makePromise(http.setAuthorizationHeaderWithUsernameAndPassword, [username, password]);
            },
            setHeader: function(header, value) {
                return makePromise(http.setHeader, [header, value]);
            },
            setSSLPinningMode: function(mode) {
                return makePromise(http.setSSLPinningMode, [mode]);
            },
            validateEntireCertificateChain: function(validateChain) {
                return makePromise(http.validateEntireCertificateChain, [validateChain]);
            },
            allowInvalidCertificates: function(allow) {
                return makePromise(http.allowInvalidCertificates, [allow]);
            },
            acceptText: function() {
                return makePromise(http.acceptText, []);
            },
            acceptData: function() {
                return makePromise(http.acceptData, []);
            },
            setAcceptableContentTypes: function(contentTypes) {
                return makePromise(http.setAcceptableContentTypes, [contentTypes]);
            },
            post: function(url, params, headers) {
                return makePromise(http.post, [url, params, headers], true);
            },
            get: function(url, params) {
                return makePromise(http.get, [url, params], true);
            },
            uploadFile: function(url, params, filePath, name) {
                return makePromise(http.uploadFile, [url, params, filePath, name], true);
            },
            downloadFile: function(url, params, filePath) {
                return makePromise(http.downloadFile, [url, params, filePath], true);
            }
        };
        return cordovaHTTP;
    });
} else {
    window.cordovaHTTP = http;
}