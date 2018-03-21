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
 - SSL Pinning - read more at [LumberBlog](http://blog.lumberlabs.com/2012/04/why-app-developers-should-care-about.html).

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

### With AngularJS (Deprecated)

:warning: *This feature is deprecated and will be removed anytime soon.* :warning:

This plugin creates a cordovaHTTP service inside of a cordovaHTTP module.  You must load the module when you create your app's module.

```js
var app = angular.module('myApp', ['ngRoute', 'ngAnimate', 'cordovaHTTP']);
```

You can then inject the cordovaHTTP service into your controllers.  The functions can then be used identically to the examples shown below except that instead of accepting success and failure callback functions, each function returns a promise.  For more information on promises in AngularJS read the [AngularJS docs](http://docs.angularjs.org/api/ng/service/$q).  For more info on promises in general check out this article on [html5rocks](http://www.html5rocks.com/en/tutorials/es6/promises/).  Make sure that you load cordova.js or phonegap.js after AngularJS is loaded.


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

You can also override the default content type headers by specifying your own headers (see [setHeader](#setHeader)).

__Caution__: `urlencoded` does not support serializing deep structures whereas `json` does.

### setRequestTimeout
Set how long to wait for a request to respond, in seconds.

```js
cordova.plugin.http.setRequestTimeout(5.0);
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

### enableSSLPinning
Enable or disable SSL pinning.  This defaults to false.

To use SSL pinning you must include at least one .cer SSL certificate in your app project.  You can pin to your server certificate or to one of the issuing CA certificates. For ios include your certificate in the root level of your bundle (just add the .cer file to your project/target at the root level).  For android include your certificate in your project's platforms/android/assets folder.  In both cases all .cer files found will be loaded automatically.  If you only have a .pem certificate see this [stackoverflow answer](http://stackoverflow.com/a/16583429/3182729).  You want to convert it to a DER encoded certificate with a .cer extension.

As an alternative, you can store your .cer files in the www/certificates folder.

```js
cordova.plugin.http.enableSSLPinning(true, function() {
  console.log('success!');
}, function() {
  console.log('error :(');
});
```

### acceptAllCerts
Accept all SSL certificates.  Or disable accepting all certificates.  This defaults to false.

```js
cordova.plugin.http.acceptAllCerts(true, function() {
  console.log('success!');
}, function() {
  console.log('error :(');
});
```

### disableRedirect
If set to `true`, it won't follow redirects automatically. This defaults to false.

```js
cordova.plugin.http.disableRedirect(true, function() {
  console.log('success!');
}, function() {
  console.log('error :(');
});
```

### validateDomainName
This function was removed in v1.6.2. Domain name validation is disabled automatically when you enable "acceptAllCerts".

### removeCookies
Remove all cookies associated with a given URL.

```js
cordova.plugin.http.removeCookies(url, callback);
```

### sendRequest
Execute a HTTP request.  Takes a URL and an options object. This is the internally used implementation of the following shorthand functions ([post](#post), [get](#get), [put](#put), [patch](#patch), [delete](#delete), [head](#head), [uploadFile](#uploadFile) and [downloadFile](#downloadFile)). You can use this function, if you want to override global settings for each single request.

The options object contains following keys:

* `method`: HTTP method to be used, defaults to `get`, needs to be one of the following values:
  * `get`, `post`, `put`, `patch`, `head`, `delete`, `upload`, `download`
* `data`: payload to be send to the server (only applicable on `post`, `put` or `patch` methods)
* `params`: query params to be appended to the URL (only applicable on `get`, `head`, `delete`, `upload` or `download` methods)
* `serializer`: data serializer to be used (only applicable on `post`, `put` or `patch` methods), defaults to global serializer value, see [setDataSerializer](#setDataSerializer) for supported values
* `timeout`: timeout value for the request in seconds, defaults to global timeout value
* `headers`: headers object (key value pair), will be merged with global values
* `filePath`: filePath to be used during upload and download see [uploadFile](#uploadFile) and [downloadFile](#downloadFile) for detailed information
* `name`: name to be used during upload see [uploadFile](#uploadFile) for detailed information

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
The error function receives a response object with 4 properties: status, error, url, and headers (url and headers being optional).  **status** is the HTTP response code as numeric value. **error** is the error response from the server as a string. **url** is the final URL obtained after any redirects as a string. **headers** is an object with the headers. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

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

### get<a name="get"></a>
Execute a GET request.  Takes a URL, parameters, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

```js
cordova.plugin.http.get('https://google.com/', {
  id: 12,
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
Uploads a file saved on the device.  Takes a URL, parameters, headers, filePath, and the name of the parameter to pass the file along as.  See the [post](#post) documentation for details on what is returned on success and failure.

```js
cordova.plugin.http.uploadFile("https://google.com/", {
    id: 12,
    message: 'test'
}, { Authorization: 'OAuth2: token' }, 'file:///somepicture.jpg', 'picture', function(response) {
    console.log(response.status);
}, function(response) {
    console.error(response.error);
});
```

### downloadFile<a name="downloadFile"></a>
Downloads a file and saves it to the device.  Takes a URL, parameters, headers, and a filePath.  See [post](#post) documentation for details on what is returned on failure.  On success this function returns a cordova [FileEntry object](http://cordova.apache.org/docs/en/3.3.0/cordova_file_file.md.html#FileEntry).

```js
cordova.plugin.http.downloadFile("https://google.com/", {
  id: 12,
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
