#import <Foundation/Foundation.h>

#import <Cordova/CDVPlugin.h>

@interface CordovaHttpPlugin : CDVPlugin

- (void)setSSLCertMode:(CDVInvokedUrlCommand*)command;
- (void)disableRedirect:(CDVInvokedUrlCommand*)command;
- (void)post:(CDVInvokedUrlCommand*)command;
- (void)get:(CDVInvokedUrlCommand*)command;
- (void)put:(CDVInvokedUrlCommand*)command;
- (void)patch:(CDVInvokedUrlCommand*)command;
- (void)delete:(CDVInvokedUrlCommand*)command;
- (void)uploadFile:(CDVInvokedUrlCommand*)command;
- (void)downloadFile:(CDVInvokedUrlCommand*)command;

@end
