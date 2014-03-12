#import <Foundation/Foundation.h>

#import <Cordova/CDVPlugin.h>
#import <Cordova/CDVJSON.h>

@interface CordovaHTTP : CDVPlugin

- (void)setAuthorizationHeaderWithUsernameAndPassword:(CDVInvokedUrlCommand*)command;
- (void)setHeader:(CDVInvokedUrlCommand*)command;
- (void)setSSLPinningMode:(CDVInvokedUrlCommand*)command;
- (void)validateEntireCertificateChain:(CDVInvokedUrlCommand*)command;
- (void)allowInvalidCertificates:(CDVInvokedUrlCommand*)command;
- (void)acceptText:(CDVInvokedUrlCommand*)command;
- (void)acceptData:(CDVInvokedUrlCommand*)command;
- (void)setAcceptableContentTypes:(CDVInvokedUrlCommand*)command;
- (void)post:(CDVInvokedUrlCommand*)command;
- (void)get:(CDVInvokedUrlCommand*)command;
- (void)uploadFile:(CDVInvokedUrlCommand*)command;
- (void)downloadFile:(CDVInvokedUrlCommand*)command;

@end
