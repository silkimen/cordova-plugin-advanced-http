# Changelog

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
