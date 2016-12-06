function registerService(http) {
    if (typeof angular === 'undefined') return;

    angular.module('cordovaHTTP', []).factory('cordovaHTTP', function ($timeout, $q) {
        function makePromise(fn, args, async) {
            var deferred = $q.defer();

            var success = function (response) {
                if (async) {
                    $timeout(function () {
                        deferred.resolve(response);
                    });
                } else {
                    deferred.resolve(response);
                }
            };

            var fail = function (response) {
                if (async) {
                    $timeout(function () {
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
            getBasicAuthHeader: http.getBasicAuthHeader,
            useBasicAuth: function (username, password) {
                return http.useBasicAuth(username, password);
            },
            setHeader: function (header, value) {
                return http.setHeader(header, value);
            },
            setDataSerializer: function (serializer) {
                return http.setParamSerializer(serializer);
            },
            clearCookies: function () {
                return http.clearCookies();
            },
            enableSSLPinning: function (enable) {
                return makePromise(http.enableSSLPinning, [enable]);
            },
            acceptAllCerts: function (allow) {
                return makePromise(http.acceptAllCerts, [allow]);
            },
            validateDomainName: function (validate) {
                return makePromise(http.validateDomainName, [validate]);
            },
            post: function (url, data, headers) {
                return makePromise(http.post, [url, data, headers], true);
            },
            get: function (url, params, headers) {
                return makePromise(http.get, [url, params, headers], true);
            },
            put: function (url, data, headers) {
                return makePromise(http.put, [url, data, headers], true);
            },
            delete: function (url, params, headers) {
                return makePromise(http.delete, [url, params, headers], true);
            },
            head: function (url, params, headers) {
                return makePromise(http.head, [url, params, headers], true);
            },
            uploadFile: function (url, params, headers, filePath, name) {
                return makePromise(http.uploadFile, [url, params, headers, filePath, name], true);
            },
            downloadFile: function (url, params, headers, filePath) {
                return makePromise(http.downloadFile, [url, params, headers, filePath], true);
            }
        };
        return cordovaHTTP;
    });
}

module.exports = {
    registerService: registerService
};
