# Changelog

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