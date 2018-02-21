Cordova Advanced HTTP
=====================

Cordova / Phonegap plugin for communicating with HTTP servers.  Supports iOS and Android.
This is a fork of [Silkimen's Cordova-plugin-advanced-http plugin](https://github.com/silkimen/cordova-plugin-advanced-http).

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

### Without AngularJS

This plugin registers a global object located at `cordova.plugin.http`.

### With AngularJS

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

### disableRedirect
If set to `true`, it won't follow redirects automatically. This is a global setting.

```js
cordova.plugin.http.disableRedirect(true);
```

### setDataSerializer
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

### addPinningCerts
Add additional certificates to pin against at runtime.

If you have a secure channel to distribute certificates, you can update certificates at runtime. This allows you to rotate expired certificates without having to force users to update their app.

After SSL pinning has been enabled you can add Base64 DER encoded certificates.

```js
CordovaHttpPlugin.addPinningCerts(['MIIEyzCCA7OgAwIBA...', 'MIIFHzCCBAegAwIBA...'], function() {
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

### validateDomainName
This function was removed in v1.6.2. Domain name validation is disabled automatically when you enable "acceptAllCerts".

### removeCookies
Remove all cookies associated with a given URL.

```js
cordova.plugin.http.removeCookies(url, callback);
```

### post<a name="post"></a>
Execute a POST request.  Takes a URL, data, and headers.

#### success
The success function receives a response object with 3 properties: status, data, and headers.  **status** is the HTTP response code as numeric value. **data** is the response from the server as a string. **headers** is an object with the headers. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

Here's a quick example:

```js
{
  status: 200,
  data: '{"id": 12, "message": "test"}',
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
The error function receives a response object with 3 properties: status, error and headers.  **status** is the HTTP response code as numeric value. **error** is the error response from the server as a string.  **headers** is an object with the headers. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

Here's a quick example:

```js
{
  status: 403,
  error: 'Permission denied',
  headers: {
    'content-length': '247'
  }
}
```

### get
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

### put
Execute a PUT request.  Takes a URL, data, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

### patch
Execute a PATCH request.  Takes a URL, data, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

### delete
Execute a DELETE request.  Takes a URL, parameters, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

### head
Execute a HEAD request.  Takes a URL, parameters, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

### uploadFile
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

### downloadFile
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


## Libraries

This plugin utilizes some awesome open source libraries:

 - iOS - [AFNetworking](https://github.com/AFNetworking/AFNetworking) (MIT licensed)
 - Android - [http-request](https://github.com/kevinsawicki/http-request) (MIT licensed)
 - Cookie handling - [tough-cookie](https://github.com/salesforce/tough-cookie) (BSD-3-Clause licensed)

We made a few modifications to the networking libraries.

## Contribute & Develop

We've set up a separate document for our [contribution guidelines](CONTRIBUTING.md).
