Cordova Advanced HTTP
=====================
[![npm version](https://badge.fury.io/js/cordova-plugin-advanced-http.svg)](https://badge.fury.io/js/cordova-plugin-advanced-http)
[![downloads/month](https://img.shields.io/npm/dm/cordova-plugin-advanced-http.svg)](https://www.npmjs.com/package/cordova-plugin-advanced-http)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.png)](https://opensource.org/licenses/mit-license.php)
[![Build Status](https://travis-ci.org/silkimen/cordova-plugin-advanced-http.svg?branch=master)](https://travis-ci.org/silkimen/cordova-plugin-advanced-http)


Cordova / Phonegap plugin for communicating with HTTP servers.  Supports iOS, Android and [Browser](#browserSupport).

This is a fork of [Wymsee's Cordova-HTTP plugin](https://github.com/wymsee/cordova-HTTP).

## Advantages over Javascript requests

 - Background threading - all requests are done in a background thread.
 - Handling of HTTP code 401 - read more at [Issue CB-2415](https://issues.apache.org/jira/browse/CB-2415).
 - SSL Pinning

## Updates

Please check [CHANGELOG.md](CHANGELOG.md) for details about updating to a new version.

## Installation

The plugin conforms to the Cordova plugin specification, it can be installed
using the Cordova / Phonegap command line interface.

```shell
phonegap plugin add cordova-plugin-advanced-http

cordova plugin add cordova-plugin-advanced-http
```

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
Set a header for all future requests to a specified host. Takes a hostname, a header and a value (must be a string value).

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
* `urlencoded`: send data as url encoded content in body (content type "application/x-www-form-urlencoded")
* `json`: send data as JSON encoded content in body (content type "application/json")
* `utf8`: send data as plain UTF8 encoded string in body (content type "plain/text")
* `multipart`: send FormData objects as multipart content in body (content type "multipart/form-data")

This defaults to `urlencoded`. You can also override the default content type headers by specifying your own headers (see [setHeader](#setHeader)).

:warning: `urlencoded` does not support serializing deep structures whereas `json` does.

:warning: `multipart` depends on several Web API standards which need to be supported in your web view. Check out https://github.com/silkimen/cordova-plugin-advanced-http/wiki/Web-APIs-required-for-Multipart-requests for more info.

### setRequestTimeout
Set how long to wait for a request to respond, in seconds.

```js
cordova.plugin.http.setRequestTimeout(5.0);
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
Add a custom cookie. Takes a URL, a cookie string and an options object. See [ToughCookie documentation](https://github.com/salesforce/tough-cookie#setcookiecookieorstring-currenturl-options-cberrcookie) for allowed options.

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

### disableRedirect (deprecated)
This function was deprecated in 2.0.9. Use ["setFollowRedirect"](#setFollowRedirect) instead.

### setSSLCertMode (deprecated)
This function was deprecated in 2.0.8. Use ["setServerTrustMode"](#setServerTrustMode) instead.

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
  * `get`, `post`, `put`, `patch`, `head`, `delete`, `upload`, `download`
* `data`: payload to be send to the server (only applicable on `post`, `put` or `patch` methods)
* `params`: query params to be appended to the URL (only applicable on `get`, `head`, `delete`, `upload` or `download` methods)
* `serializer`: data serializer to be used (only applicable on `post`, `put` or `patch` methods), defaults to global serializer value, see [setDataSerializer](#setDataSerializer) for supported values
* `responseType`: expected response type, defaults to `text`, needs to be one of the following values:
  * `text`: data is returned as decoded string, use this for all kinds of string responses (e.g. XML, HTML, plain text, etc.)
  * `json` data is treated as JSON and returned as parsed object
  * `arraybuffer`: data is returned as [ArrayBuffer instance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
  * `blob`: data is returned as [Blob instance](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
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
  headers: { Authorization: 'OAuth2: token' }
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
Downloads a file and saves it to the device.  Takes a URL, parameters, headers, and a filePath.  See [post](#post) documentation for details on what is returned on failure.  On success this function returns a cordova [FileEntry object](http://cordova.apache.org/docs/en/3.3.0/cordova_file_file.md.html#FileEntry).

```js
cordova.plugin.http.downloadFile("https://google.com/", {
  id: '12',
  message: 'test'
}, { Authorization: 'OAuth2: token' }, 'file:///somepicture.jpg', function(entry) {
  // prints the filename
  console.log(entry.name);

  // prints the filePath
  console.log(entry.fullPath);
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

## Libraries

This plugin utilizes some awesome open source libraries:

 - iOS - [AFNetworking](https://github.com/AFNetworking/AFNetworking) (MIT licensed)
 - Android - [http-request](https://github.com/kevinsawicki/http-request) (MIT licensed)
 - Cookie handling - [tough-cookie](https://github.com/salesforce/tough-cookie) (BSD-3-Clause licensed)

We made a few modifications to the networking libraries.

## Contribute & Develop

We've set up a separate document for our [contribution guidelines](CONTRIBUTING.md).
