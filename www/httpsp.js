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
        return exec(success, failure, "HTTPSPinning", "setAuthorizationHeaderWithUsernameAndPassword", [username, password]);
    },
    setHeader: function(header, value, success, failure) {
        return exec(success, failure, "HTTPSPinning", "setHeader", [header, value]);
    },
    setSSLPinningMode: function(mode, success, failure) {
        return exec(success, failure, "HTTPSPinning", "setSSLPinningMode", [mode]);
    },
    validateEntireCertificateChain: function(validateChain, success, failure) {
        return exec(success, failure, "HTTPSPinning", "validateEntireCertificateChain", [validateChain]);
    },
    allowInvalidCertificates: function(allow, success, failure) {
        return exec(success, failure, "HTTPSPinning", "allowInvalidCertificates", [allow]);
    },
    acceptText: function(success, failure) {
        return exec(success, failure, "HTTPSPinning", "acceptText", []);
    },
    acceptData: function(contentTypes, success, failure) {
        return exec(success, failure, "HTTPSPinning", "acceptData", []);
    },
    setAcceptableContentTypes: function(contentTypes, success, failure) {
        return exec(success, failure, "HTTPSPinning", "setAcceptableContentTypes", contentTypes);
    },
    post: function(url, params, success, failure) {
        return exec(success, failure, "HTTPSPinning", "post", [url, params]);
    },
    get: function(url, params, success, failure) {
        return exec(success, failure, "HTTPSPinning", "get", [url, params]);
    },
    uploadFile: function(url, params, filePath, name, success, failure) {
        return exec(success, failure, "HTTPSPinning", "uploadFile", [url, params, filePath, name]);
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
            var entry = new (require('org.apache.cordova.core.file.FileEntry'))();
            entry.isDirectory = false;
            entry.isFile = true;
            console.log(result);
            console.log(JSON.stringify(result));
            entry.name = result.file.name;
            entry.fullPath = result.file.fullPath;
            success(entry);
        };
        return exec(win, failure, "HTTPSPinning", "downloadFile", [url, params, filePath]);
    }
};

window.http = http;