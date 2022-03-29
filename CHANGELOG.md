# Changelog

# 3.3.0

- Feature #451: expose response object on `downloadFile()` (thanks to @MobisysGmbH)

# 3.2.2

- Fixed #438: requests not working correctly on browser platform because request options are not processed correctly

## 3.2.1

- Fixed #425: plugin crashes on Android SDK levels < 24
- Fixed #418: deprecated AFNetworking method causes app crash (thanks meiram-tr)
- Fixed #404: wrong timeout implementation (thanks YouYue123)

## 3.2.0

- Feature #420: implement blacklist feature to disable SSL/TLS versions on Android (thanks to @MobisysGmbH)

## 3.1.1

- Fixed #372: malformed empty multipart request on Android
- Fixed #399: memory leakage leads to app crashes on iOS (thanks avargaskun)

## 3.1.0

- Feature #272: add support for aborting requests (thanks russaa)

## 3.0.1

- Fixed #359: memory leakage leads to app crashes on Android
- Fixed #355: responseType "json" not working with valid JSON response on browser (thanks millerg6711)

## 3.0.0

- Feature #158: support removing headers which were previously set via "setHeader"

- Fixed #345: empty file names are not handled correctly (thanks ikosta)

- :warning: **Breaking Change**: Dropped support for Android < 5.1
- :warning: **Breaking Change**: Removed "disableRedirect", use "setFollowRedirect" instead
- :warning: **Breaking Change**: Removed "setSSLCertMode", use "setServerTrustMode" instead

## 2.5.1

- Fixed #334: empty JSON response triggers error even though request is successful (thanks antikalk)
- Fixed #248: clearCookies() does not work on iOS

## 2.5.0

- Feature #56: add support for X.509 client certificate based authentication

## 2.4.1

- Fixed #296: multipart requests are not serialized on browser platform
- Fixed #301: data is not decoded correctly when responseType is "json" (thanks antikalk)
- Fixed #300: FormData object containing null or undefined value is not serialized correctly

## 2.4.0

- Feature #291: add support for sending 'raw' requests (thanks to jachstet-sea and chuchuva)
- Feature #155: add OPTIONS method
- Feature #283: improve error message on timeout on browser platform

## 2.3.1

- Fixed #275: getAllCookies() is broken because of a typo (thanks ath0mas)

## 2.3.0

- Feature #101: Support "multipart/form-data" requests (thanks SDA SE Open Industry Solutions)

#### Important information
This feature depends on several Web APIs. See https://github.com/silkimen/cordova-plugin-advanced-http/wiki/Web-APIs-required-for-Multipart-requests for more info.

## 2.2.0

- Feature #239: add enumeration style object for error codes
- Feature #253: add support for response type "json"
- Feature #127: add multiple file upload (thanks SDA SE Open Industry Solutions and nilswitschel)

## 2.1.1

- Fixed #224: response type "arraybuffer" and "blob" not working on browser platform

## 2.1.0

- Feature #216: Support for response type `arraybuffer`
- Feature #171: Support for response type `blob`
- Feature #205: Add preference for configuring OKHTTP version (thanks RougeCiel)

## 2.0.11

- Fixed #221: headers not set on Android when request fails due to non-success status code

## 2.0.10

- Fixed #218: headers are used as params on browser platform

## 2.0.9

- Fixed #204: broken support for cordova-android  < 7.0

- :warning: **Deprecation**: Deprecated "disableRedirect" in favor of "setFollowRedirect"

## 2.0.8

- Fixed #198: cookie header is always passed even if there is no cookie
- Fixed #201: browser implementation is broken due to broken dependency
- Fixed #197: iOS crashes when multiple request are done simultaneously (reverted a8e3637)
- Fixed #189: error code mappings are not precise
- Fixed #200: compatibility with Java 6 is broken due to string switch on Android

- :warning: **Deprecation**: Deprecated "setSSLCertMode" in favor of "setServerTrustMode"

## 2.0.7

- Fixed #195: URLs are double-encoded on Android

## 2.0.6

- Fixed #187: setSSLCertMode with "default" throws an error on Android
- Fixed #115: HTTP connections are not kept alive on iOS (thanks MorpheusDe97)

## 2.0.5

- Fixed #185: need more detailed SSL error message

## 2.0.4

- Fixed #179: sending empty string with utf8 serializer throws an exception

## 2.0.3

- Fixed #172: plugin does not respect user installed CA certs on Android

#### Important information
We've changed a default behavior on Android. User installed CA certs are respected now.
If you don't want this for your needs, you can switch back to old behavior by setting SSL cert mode to `legacy`.

## 2.0.2

- Fixed #142: Plugin affected by REDoS Issue of tough-cookie
- Fixed #157: Arguments are double URL-encoded on "downloadFile" (thanks TheZopo)
- Fixed #164: Arguments are double URL-encoded on "head" (thanks ath0mas)

## 2.0.1

- Fixed #136: Content-Type header non-overwritable on browser platform

## 2.0.0

- Feature #103: implement HTTP SSL cert modes

- :warning: **Breaking Change**: Removed AngularJS (v1) integration service
- :warning: **Breaking Change**: Removed "enableSSLPinning" and "acceptAllCerts", use "setSSLCertMode" instead
- :warning: **Breaking Change**: Certificates must be placed in "www/certificates" folder

## 1.11.1

- Fixed #92: headers not deserialized on platform "browser"

## 1.11.0

- Feature #77: allow overriding global settings for each single request
- Feature #11: add support for "browser" platform

## 1.10.2

- Fixed #78: overriding header "Content-Type" not working on Android
- Fixed #79: PATCH operation not working on Android API level 19 and older (thanks chax)
- Fixed #83: App crashes on error during download operation on iOS (thanks troyanskiy)
- Fixed #76: upload sequence is not respecting order of operations needed by some sites (thanks Johny101)

- :warning: **Deprecation**: AngularJS service is deprecated now and will be removed anytime soon

## 1.10.1

- Fixed #71: does not encode query string in URL correctly on Android
- Fixed #72: app crashes if response encoding is not UTF-8 (thanks jkfb)

## 1.10.0

- Feature #34: add new serializer "utf8" sending utf-8 encoded plain text (thanks robertocapuano)

## 1.9.1

- Fixed #45: does not encode arrays correctly as HTTP GET parameter on Android
- Fixed #54: requests are not responding on iOS with non-string values in header object
- Fixed #58: white-list of allowed content-types should be removed for iOS

## v1.9.0

- Feature #44: "getCookieString" method is exposed
- Feature #43: added support for content type "application/javascript" on iOS (thanks wh33ler)
- Feature #46: "setCookie" allows adding custom cookies

## v1.8.1

- Fixed #27: "uploadFile" method doesn't return data object on iOS (thanks Faisalali23 and laiyinjie)
- Fixed #40: generic error codes are different on Android and iOS

## v1.8.0

- Feature #33: response object contains response url

## v1.7.1

- Fixed #36: setting basic authentication not working correctly (thanks jkfb)
- Fixed #35: Android headers are not normalized (not returned in lowercase)
- Fixed #26: JSON request with array data is not working on Android (JSON error)

## v1.7.0

- Feature #24: "setHeader" allows configuring headers for specified host

## v1.6.2

- Change #29: removed "validateDomainName" (see info notice)
- Fixed #31: request fails throwing error on erroneous cookies
- Fixed #28: added support for content type "application/hal+json" on iOS (thanks ryandegruyter)

#### Important information
We've decided to remove the `validateDomainName()` method, because people were complaining that `acceptAllCerts(true)` is not behaving as expected. And also it's not a good idea to disable domain name validation while using valid certs, because it pretends having a secure connection, but it isn't.

You should either use valid certs with domain name validation enabled (safe for production use) or accept any certs without domain name validation (only for private dev environments). I strongly discourage using fake certs in public networks.

Therefore we are disabling domain name validation automatically, when you set `acceptAllCerts(true)`. So if you were using `validateDomainName()` function, you need to remove this function call for v1.6.2+.

## v1.6.1

- Fixed #23: PATCH method broken on android

## v1.6.0

- Feature #18: implemented PATCH method (thanks akhatri for android implementation)
- Feature #21: added redirection control (thanks to notsyncing and kesozjura)
- Fixed #16: cordova tries to run build script during plugin install

## v1.5.10

- Fixed #10: fix gzip decompression when request header accepts gzip compression (thanks to DayBr3ak)
- Fixed #13: fix angular integration for `setDataSerializer` (thanks to RangerRick)
- Added some missing documentation (thanks to RangerRick)

## v1.5.9

- Fixed case-sensitive folder name of Android source files

## v1.5.8

- Use the same error codes if a request timed out

## v1.5.7

- Fixed a bug in cookie handling (cookies containing an "Expires" string)
- Added setRequestTimeout function to set the timeout in seconds for all further requests

## v1.5.6

- All response header keys are converted to lowercase (iOS only)

## v1.5.5

- added a function to remove all cookies for a URL

## v1.5.4

- fixed an error if the response has no "headers" field

## v1.5.3

- handles cookies correctly on non-success response from server
- throws error when a callback function is missing

## v1.5.2

- fixed missing file "umd-tough-cookie.js“ (caused by missing file ".npmignore")

## v1.5.1

- fixed case-sensitive path name of android source files ("CordovaHTTP" --> "cordovahttp")

## v1.5.0

- added cookie handling
- cookies are persisted via web storage API

## v1.4.0

- forked from "cordova-plugin-http" v1.2.0 (see https://github.com/wymsee/cordova-HTTP)
- added configuration for data serializer
- added HTTP methods PUT and DELETE

# Previous changelog (cordova-plugin-http)

## v1.2.0

- Added support for TLSv1.1 and TLSv1.2 for android versions 4.1-4.4 (API levels 16-19)

### Potentially Breaking Changes that really shouldn't matter because you shouldn't be using SSLv3

- Dropped SSLv3 support for all API Levels < 20.  It will now only work on API Levels 20-22.

## v1.1.0

- Fixed the body of errors not being returned in iOS
- Updated AFNetworking to 3.1.0

### Potentially Breaking Changes

- Disable encoding get() URLS in android (Thanks to devgeeks)

## v1.0.3

- Fixed version number in plugin.xml

## v1.0.2

- Fixed bug using useBasicAuth and setHeader from angular

## v1.0.1

- updated README

## v1.0.0

- Added getBasicAuthHeader function
- Added necessary iOS framework (Thanks to EddyVerbruggen)
- Request internet permission in android (Thanks to mbektchiev)
- Fix acceptAllCerts doesn't call callbacks (Thanks to EddyVerbruggen)
- Add validateDomainName (Thanks to denisbabineau)
- Add HEAD request support (untested) (Thanks to denisbabineau)

### Potentially Breaking Changes

- Update cordova file plugin dependency (Thanks to denisbabineau)
- useBasicAuthHeader and setHeader are now synchronous functions
- updated AFNetworking to 3.0.4 - only iOS 7+ is now supported
- updated http-request to 6.0

## v0.1.4

- Support for certificates in www/certificates folder (Thanks to EddyVerbruggen)

## v0.1.3

- Update AFNetworking to 2.4.1 for iOS bug fix in Xcode 6

## v0.1.2

- Fixed plugin.xml for case sensitive filesystems (Thanks to andrey-tsaplin)

## v0.1.1

- Fixed a bug that prevented building

## v0.1.0

- Initial release


## Contributions not noted above

- Fixed examples (Thanks to devgeeks)
- Reports SSL Handshake errors rather than giving a generic error (Thanks to devgeeks)
- Exporting http as a module (Thanks to pvsaikrishna)
- Added Limitations section to readme (Thanks to cvillerm)
- Fixed examples (Thanks to hideov)
