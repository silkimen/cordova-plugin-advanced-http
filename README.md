Cordova Advanced HTTP
=====================
[![npm version](https://img.shields.io/npm/v/cordova-plugin-advanced-http)](https://www.npmjs.com/package/cordova-plugin-advanced-http?activeTab=versions)
[![MIT Licence](https://img.shields.io/badge/license-MIT-blue?style=flat)](https://opensource.org/licenses/mit-license.php)
[![downloads/month](https://img.shields.io/npm/dm/cordova-plugin-advanced-http.svg)](https://www.npmjs.com/package/cordova-plugin-advanced-http)

[![Travis Build Status](https://img.shields.io/travis/com/silkimen/cordova-plugin-advanced-http/master?label=Travis%20CI)](https://app.travis-ci.com/silkimen/cordova-plugin-advanced-http)
[![GitHub Build Status](https://img.shields.io/github/actions/workflow/status/silkimen/cordova-plugin-advanced-http/.github/workflows/ci.yml?branch=master)](https://github.com/silkimen/cordova-plugin-advanced-http/actions)


Cordova / Phonegap plugin for communicating with HTTP servers.  Supports iOS, Android and [Browser](#browserSupport).

This is a fork of [Wymsee's Cordova-HTTP plugin](https://github.com/wymsee/cordova-HTTP).

## Advantages over Javascript requests

 - SSL / TLS Pinning
 - CORS restrictions do not apply
 - X.509 client certificate based authentication
 - Handling of HTTP code 401 - read more at [Issue CB-2415](https://issues.apache.org/jira/browse/CB-2415)

## Updates

Please check [CHANGELOG.md](CHANGELOG.md) for details about updating to a new version.

## Installation

The plugin conforms to the Cordova plugin specification, it can be installed
using the Cordova / Phonegap command line interface.

```shell
phonegap plugin add cordova-plugin-advanced-http

cordova plugin add cordova-plugin-advanced-http
```

### Plugin Preferences

`AndroidBlacklistSecureSocketProtocols`: define a blacklist of secure socket protocols for Android. This preference allows you to disable protocols which are considered unsafe. You need to provide a comma-separated list of protocols ([check Android SSLSocket#protocols docu for protocol names](https://developer.android.com/reference/javax/net/ssl/SSLSocket#protocols)).

e.g. blacklist `SSLv3` and `TLSv1`:
```xml
<preference name="AndroidBlacklistSecureSocketProtocols" value="SSLv3,TLSv1" />
```

## Currently known issues

- [abort](#abort)ing sent requests is not working reliably

## Usage

### Plain Cordova

This plugin registers a global object located at `cordova.plugin.http`.

### With Ionic-native wrapper

Check the [Ionic docs](https://ionicframework.com/docs/native/http/) for how to use this plugin with Ionic-native.

## Synchronous Functions

### getBasicAuthHeader
This returns an object representing a basic HTTP Authorization header of the form `{'Authorization': 'Basic base64encodedusernameandpassword'}`

```js
var header = cordova.plugin.http.getBasicAuthHeader('user', 'password');
```

### useBasicAuth
This sets up all future requests to use Basic HTTP authentication with the given username and password.

```js
cordova.plugin.http.useBasicAuth('user', 'password');
```

### setHeader<a name="setHeader"></a>
Set a header for all future requests to a specified host. Takes a hostname, a header and a value (must be a string value or null).

```js
cordova.plugin.http.setHeader('Hostname', 'Header', 'Value');
```

You can also define headers used for all hosts by using wildcard character "\*" or providing only two params.

```js
cordova.plugin.http.setHeader('*', 'Header', 'Value');
cordova.plugin.http.setHeader('Header', 'Value');
```

The hostname also includes the port number. If you define a header for `www.example.com` it will not match following URL `http://www.example.com:8080`.

```js
// will match http://www.example.com/...
cordova.plugin.http.setHeader('www.example.com', 'Header', 'Value');

// will match http://www.example.com:8080/...
cordova.plugin.http.setHeader('www.example.com:8080', 'Header', 'Value');
```

### setDataSerializer<a name="setDataSerializer"></a>
Set the data serializer which will be used for all future PATCH, POST and PUT requests. Takes a string representing the name of the serializer.

```js
cordova.plugin.http.setDataSerializer('urlencoded');
```

You can choose one of these:
* `urlencoded`: send data as url encoded content in body
  * default content type "application/x-www-form-urlencoded"
  * data must be an dictionary style `Object`
* `json`: send data as JSON encoded content in body
  * default content type "application/json"
  * data must be an `Array` or an dictionary style `Object`
* `utf8`: send data as plain UTF8 encoded string in body
  * default content type "plain/text"
  * data must be a `String`
* `multipart`: send FormData objects as multipart content in body
  * default content type "multipart/form-data"
  * data must be an `FormData` instance
* `raw`: send data as is, without any processing
  * default content type "application/octet-stream"
  * data must be an `Uint8Array` or an `ArrayBuffer`

This defaults to `urlencoded`. You can also override the default content type headers by specifying your own headers (see [setHeader](#setHeader)).

:warning: `urlencoded` does not support serializing deep structures whereas `json` does.

:warning: `multipart` depends on several Web API standards which need to be supported in your web view. Check out https://github.com/silkimen/cordova-plugin-advanced-http/wiki/Web-APIs-required-for-Multipart-requests for more info.

### setRequestTimeout
Set how long to wait for a request to respond, in seconds.
For Android, this will set both [connectTimeout](https://developer.android.com/reference/java/net/URLConnection#getConnectTimeout()) and [readTimeout](https://developer.android.com/reference/java/net/URLConnection#setReadTimeout(int)).
For iOS, this will set [timeout interval](https://developer.apple.com/documentation/foundation/nsmutableurlrequest/1414063-timeoutinterval).
For browser platform, this will set [timeout](https://developer.mozilla.org/fr/docs/Web/API/XMLHttpRequest/timeout).
```js
cordova.plugin.http.setRequestTimeout(5.0);
```

### setConnectTimeout (Android Only)
Set connect timeout for Android
```js
cordova.plugin.http.setRequestTimeout(5.0);
```

### setReadTimeout (Android Only)
Set read timeout for Android
```js
cordova.plugin.http.setReadTimeout(5.0);
```

### setFollowRedirect<a name="setFollowRedirect"></a>
Configure if it should follow redirects automatically. This defaults to true.

```js
cordova.plugin.http.setFollowRedirect(true);
```

### getCookieString
Returns saved cookies (as string) matching given URL.

```js
cordova.plugin.http.getCookieString(url);
```

### setCookie
Add a custom cookie. Takes a URL, a cookie string and an options object. See [ToughCookie documentation](https://github.com/salesforce/tough-cookie#setcookiecookieorstring-currenturl-options-cberrcookie) for allowed options. Cookie will persist until removed with [removeCookies](#removecookies) or [clearCookies](#clearcookies).

```js
cordova.plugin.http.setCookie(url, cookie, options);
```

### clearCookies
Clear the cookie store.

```js
cordova.plugin.http.clearCookies();
```

## Asynchronous Functions
These functions all take success and error callbacks as their last 2 arguments.

### setServerTrustMode<a name="setServerTrustMode"></a>
Set server trust mode, being one of the following values:

* `default`: default SSL trustship and hostname verification handling using system's CA certs
* `legacy`: use legacy default behavior (< 2.0.3), excluding user installed CA certs (only for Android)
* `nocheck`: disable SSL certificate checking and hostname verification, trusting all certs (meant to be used only for testing purposes)
* `pinned`: trust only provided certificates

To use SSL pinning you must include at least one `.cer` SSL certificate in your app project.  You can pin to your server certificate or to one of the issuing CA certificates. Include your certificate in the `www/certificates` folder. All `.cer` files found there will be loaded automatically.

:warning: Your certificate must be DER encoded! If you only have a PEM encoded certificate read this [stackoverflow answer](http://stackoverflow.com/a/16583429/3182729). You want to convert it to a DER encoded certificate with a .cer extension.

```js
// enable SSL pinning
cordova.plugin.http.setServerTrustMode('pinned', function() {
  console.log('success!');
}, function() {
  console.log('error :(');
});

// use system's default CA certs
cordova.plugin.http.setServerTrustMode('default', function() {
  console.log('success!');
}, function() {
  console.log('error :(');
});

// disable SSL cert checking, only meant for testing purposes, do NOT use in production!
cordova.plugin.http.setServerTrustMode('nocheck', function() {
  console.log('success!');
}, function() {
  console.log('error :(');
});
```

### setClientAuthMode<a name="setClientAuthMode"></a>
Configure X.509 client certificate authentication. Takes mode and options. `mode` being one of following values:

* `none`: disable client certificate authentication
* `systemstore` (only on Android): use client certificate installed in the Android system store; user will be presented with a list of all installed certificates
* `buffer`: use given client certificate; you will need to provide an options object:
  * `rawPkcs`: ArrayBuffer containing raw PKCS12 container with client certificate and private key
  * `pkcsPassword`: password of the PKCS container

```js
  // enable client auth using PKCS12 container given in ArrayBuffer `myPkcs12ArrayBuffer`
  cordova.plugin.http.setClientAuthMode('buffer', {
    rawPkcs: myPkcs12ArrayBuffer,
    pkcsPassword: 'mySecretPassword'
  }, success, fail);

  // enable client auth using certificate in system store (only on Android)
  cordova.plugin.http.setClientAuthMode('systemstore', {}, success, fail);

  // disable client auth
  cordova.plugin.http.setClientAuthMode('none', {}, success, fail);
```

### removeCookies
Remove all cookies associated with a given URL.

```js
cordova.plugin.http.removeCookies(url, callback);
```

### sendRequest<a name="sendRequest"></a>
Execute a HTTP request.  Takes a URL and an options object. This is the internally used implementation of the following shorthand functions ([post](#post), [get](#get), [put](#put), [patch](#patch), [delete](#delete), [head](#head), [uploadFile](#uploadFile) and [downloadFile](#downloadFile)). You can use this function, if you want to override global settings for each single request. Check the documentation of the respective shorthand function for details on what is returned on success and failure.

:warning: You need to encode the base URL yourself if it contains special characters like whitespaces. You can use `encodeURI()` for this purpose.

The options object contains following keys:

* `method`: HTTP method to be used, defaults to `get`, needs to be one of the following values:
  * `get`, `post`, `put`, `patch`, `head`, `delete`, `options`, `upload`, `download`
* `data`: payload to be send to the server (only applicable on `post`, `put` or `patch` methods)
* `params`: query params to be appended to the URL (only applicable on `get`, `head`, `delete`, `upload` or `download` methods)
* `serializer`: data serializer to be used (only applicable on `post`, `put` or `patch` methods), defaults to global serializer value, see [setDataSerializer](#setDataSerializer) for supported values
* `responseType`: expected response type, defaults to `text`, needs to be one of the following values:
  * `text`: data is returned as decoded string, use this for all kinds of string responses (e.g. XML, HTML, plain text, etc.)
  * `json` data is treated as JSON and returned as parsed object, returns `undefined` when response body is empty
  * `arraybuffer`: data is returned as [ArrayBuffer instance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), returns `null` when response body is empty
  * `blob`: data is returned as [Blob instance](https://developer.mozilla.org/en-US/docs/Web/API/Blob), returns `null` when response body is empty
* `timeout`: timeout value for the request in seconds, defaults to global timeout value
* `followRedirect`: enable or disable automatically following redirects
* `headers`: headers object (key value pair), will be merged with global values
* `filePath`: file path(s) to be used during upload and download see [uploadFile](#uploadFile) and [downloadFile](#downloadFile) for detailed information
* `name`: name(s) to be used during upload see [uploadFile](#uploadFile) for detailed information

Here's a quick example:

```js
const options = {
  method: 'post',
  data: { id: 12, message: 'test' },
  headers: { Authorization: 'OAuth2: token' },
  onProgress: function(progressData) {
    console.log((progressData.transferred / progressData.total * 100) + ' percent complete')
  }
};

cordova.plugin.http.sendRequest('https://google.com/', options, function(response) {
  // prints 200
  console.log(response.status);
}, function(response) {
  // prints 403
  console.log(response.status);

  //prints Permission denied
  console.log(response.error);
});
```

### post<a name="post"></a>
Execute a POST request.  Takes a URL, data, and headers.

```js
cordova.plugin.http.post('https://google.com/', {
  test: 'testString'
}, {
  Authorization: 'OAuth2: token'
}, function(response) {
  console.log(response.status);
}, function(response) {
  console.error(response.error);
});
```

#### success
The success function receives a response object with 4 properties: status, data, url, and headers.  **status** is the HTTP response code as numeric value. **data** is the response from the server as a string. **url** is the final URL obtained after any redirects as a string. **headers** is an object with the headers. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

Here's a quick example:

```js
{
  status: 200,
  data: '{"id": 12, "message": "test"}',
  url: 'http://example.net/rest'
  headers: {
    'content-length': '247'
  }
}
```

Most apis will return JSON meaning you'll want to parse the data like in the example below:

```js
cordova.plugin.http.post('https://google.com/', {
  id: 12,
  message: 'test'
}, { Authorization: 'OAuth2: token' }, function(response) {
  // prints 200
  console.log(response.status);
  try {
    response.data = JSON.parse(response.data);
    // prints test
    console.log(response.data.message);
  } catch(e) {
    console.error('JSON parsing error');
  }
}, function(response) {
  // prints 403
  console.log(response.status);

  //prints Permission denied
  console.log(response.error);
});
```

#### failure
The error function receives a response object with 4 properties: status, error, url, and headers (url and headers being optional).  **status** is a HTTP response code or an internal error code. Positive values are HTTP status codes whereas negative values do represent internal error codes. **error** is the error response from the server as a string or an internal error message. **url** is the final URL obtained after any redirects as a string. **headers** is an object with the headers. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

Here's a quick example:

```js
{
  status: 403,
  error: 'Permission denied',
  url: 'http://example.net/noperm'
  headers: {
    'content-length': '247'
  }
}
```

:warning: An enumeration style object is exposed as `cordova.plugin.http.ErrorCode`. You can use it to check against internal error codes.

### get<a name="get"></a>
Execute a GET request.  Takes a URL, parameters, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

```js
cordova.plugin.http.get('https://google.com/', {
  id: '12',
  message: 'test'
}, { Authorization: 'OAuth2: token' }, function(response) {
  console.log(response.status);
}, function(response) {
  console.error(response.error);
});
```

### put<a name="put"></a>
Execute a PUT request.  Takes a URL, data, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

### patch<a name="patch"></a>
Execute a PATCH request.  Takes a URL, data, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

### delete<a name="delete"></a>
Execute a DELETE request.  Takes a URL, parameters, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

### head<a name="head"></a>
Execute a HEAD request.  Takes a URL, parameters, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

### options<a name="options"></a>
Execute a OPTIONS request.  Takes a URL, parameters, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

### uploadFile<a name="uploadFile"></a>
Uploads one or more file(s) saved on the device.  Takes a URL, parameters, headers, filePath(s), and the name(s) of the parameter to pass the file along as.  See the [post](#post) documentation for details on what is returned on success and failure.

```js
// e.g. for single file
const filePath = 'file:///somepicture.jpg';
const name = 'picture';

// e.g. for multiple files
const filePath = ['file:///somepicture.jpg', 'file:///somedocument.doc'];
const name = ['picture', 'document'];

cordova.plugin.http.uploadFile("https://google.com/", {
    id: '12',
    message: 'test'
}, { Authorization: 'OAuth2: token' }, filePath, name, function(response) {
    console.log(response.status);
}, function(response) {
    console.error(response.error);
});
```

### downloadFile<a name="downloadFile"></a>
Downloads a file and saves it to the device.  Takes a URL, parameters, headers, and a filePath.  See [post](#post) documentation for details on what is returned on failure.  On success this function returns a cordova [FileEntry object](http://cordova.apache.org/docs/en/3.3.0/cordova_file_file.md.html#FileEntry) as first and the response object as second parameter.

```js
cordova.plugin.http.downloadFile(
  "https://google.com/",
  { id: '12', message: 'test' },
  { Authorization: 'OAuth2: token' },
  'file:///somepicture.jpg',
  // success callback
  function(entry, response) {
    // prints the filename
    console.log(entry.name);

    // prints the filePath
    console.log(entry.fullPath);

    // prints all header key/value pairs
    Object.keys(response.headers).forEach(function (key) {
      console.log(key, response.headers[key]);
    });
  },
  // error callback
  function(response) {
    console.error(response.error);
  }
);
```

### abort<a name="abort"></a>
Abort a HTTP request.  Takes the `requestId` which is returned by [sendRequest](#sendRequest) and its shorthand functions ([post](#post), [get](#get), [put](#put), [patch](#patch), [delete](#delete), [head](#head), [uploadFile](#uploadFile) and [downloadFile](#downloadFile)).

If the request already has finished, the request will finish normally and the abort call result will be `{ aborted: false }`.

If the request is still in progress, the request's `failure` callback will be invoked with response `{ status: -8 }`, and the abort call result `{ aborted: true }`.

:warning: Not supported for Android < 6 (API level < 23). For Android 5.1 and below, calling `abort(reqestId)` will have no effect, i.e. the requests will finish as if the request was not cancelled.

```js
// start a request and get its requestId
var requestId = cordova.plugin.http.downloadFile("https://google.com/", {
  id: '12',
  message: 'test'
}, { Authorization: 'OAuth2: token' }, 'file:///somepicture.jpg', function(entry, response) {
  // prints the filename
  console.log(entry.name);

  // prints the filePath
  console.log(entry.fullPath);

  // prints the status code
  console.log(response.status);
}, function(response) {
  // if request was actually aborted, failure callback with status -8 will be invoked
  if(response.status === -8){
    console.log('download aborted');
  } else {
    console.error(response.error);
  }
});

//...

// abort request
cordova.plugin.http.abort(requestId, function(result) {
  // prints if request was aborted: true | false
  console.log(result.aborted);
}, function(response) {
  console.error(response.error);
});
```

## Browser support<a name="browserSupport"></a>

This plugin supports a very restricted set of functions on the browser platform.
It's meant for testing purposes, not for production grade usage.

Following features are *not* supported:

* Manipulating Cookies
* Uploading and Downloading files
* Pinning SSL certificate
* Disabling SSL certificate check
* Disabling transparently following redirects (HTTP codes 3xx)
* Circumventing CORS restrictions

## Libraries

This plugin utilizes some awesome open source libraries:

 - iOS - [AFNetworking](https://github.com/AFNetworking/AFNetworking) (MIT licensed)
 - Android - [http-request](https://github.com/kevinsawicki/http-request) (MIT licensed)
 - Cookie handling - [tough-cookie](https://github.com/salesforce/tough-cookie) (BSD-3-Clause licensed)

We made a few modifications to the networking libraries.

## CI Builds & E2E Testing

This plugin uses amazing cloud services to maintain quality. CI Builds and E2E testing are powered by:

* [GitHub Actions](https://github.com/features/actions)
* [Travis CI](https://travis-ci.org/)
* [BrowserStack](https://www.browserstack.com/)
* [Sauce Labs](https://saucelabs.com/)
* [httpbin.org](https://httpbin.org/)
* [go-httpbin](https://httpbingo.org/)

### Local Testing

First, install current package with `npm install` to fetch dev dependencies.

Then, to execute Javascript tests:
```shell
npm run test:js
```

And, to execute E2E tests:
- setup local Android sdk and emulators, or Xcode and simulators for iOS
  - launch emulator or simulator
- install [Appium](http://appium.io/) (see [Getting Started](https://github.com/appium/appium/blob/HEAD/docs/en/about-appium/getting-started.md))
  - start `appium`
- run
  -  updating client and server certificates, building test app, and running e2e tests
```shell
npm run test:android
npm run test:ios
```

## Contribute & Develop

We've set up a separate document for our [contribution guidelines](CONTRIBUTING.md).
