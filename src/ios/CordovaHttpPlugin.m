#import "CordovaHttpPlugin.h"
#import "CDVFile.h"
#import "BinaryRequestSerializer.h"
#import "BinaryResponseSerializer.h"
#import "TextResponseSerializer.h"
#import "TextRequestSerializer.h"
#import "AFHTTPSessionManager.h"
#import "SDNetworkActivityIndicator.h"

@interface CordovaHttpPlugin()

- (void)setRequestHeaders:(NSDictionary*)headers forManager:(AFHTTPSessionManager*)manager;
- (void)handleSuccess:(NSMutableDictionary*)dictionary withResponse:(NSHTTPURLResponse*)response andData:(id)data;
- (void)handleError:(NSMutableDictionary*)dictionary withResponse:(NSHTTPURLResponse*)response error:(NSError*)error;
- (NSNumber*)getStatusCode:(NSError*) error;
- (NSMutableDictionary*)copyHeaderFields:(NSDictionary*)headerFields;
- (void)setTimeout:(NSTimeInterval)timeout forManager:(AFHTTPSessionManager*)manager;
- (void)setRedirect:(bool)redirect forManager:(AFHTTPSessionManager*)manager;
- (void)setXsrfHeader:(NSDictionary*)headers withMethod:(NSString*)method forManager:(AFHTTPSessionManager*)manager;

@end

@implementation CordovaHttpPlugin {
    AFSecurityPolicy *securityPolicy;
    NSURLCredential *x509Credential;
    NSArray *pinnedDomains;
}

- (void)pluginInitialize {
    securityPolicy = [AFSecurityPolicy policyWithPinningMode:AFSSLPinningModeCertificate];
    securityPolicy.allowInvalidCertificates = NO;  // Ensure invalid certificates are not allowed
    securityPolicy.validatesDomainName = YES;      // Validate the domain name

    NSString *intermediateCertPath = [[NSBundle mainBundle] pathForResource:@"intermediate-certificate"
                                                                     ofType:@"pem"
                                                                inDirectory:@"assets"];

    // Path to the root certificate in the "assets" folder within the app bundle
    NSString *rootCertPath = [[NSBundle mainBundle] pathForResource:@"root-certificate"
                                                             ofType:@"pem"
                                                        inDirectory:@"assets"];

    NSData *intermediateCertData = [self loadCertificateFromFile:intermediateCertPath];
    NSData *rootCertData = [self loadCertificateFromFile:rootCertPath];

    pinnedDomains = [self loadPinnedDomains];


    if (intermediateCertData && rootCertData) {
        // Pin the intermediate and root certificates only
        NSSet *pinnedCertificates = [NSSet setWithObjects:intermediateCertData, rootCertData, nil];
        [securityPolicy setPinnedCertificates:pinnedCertificates];
    }
}

- (NSArray *)loadPinnedDomains {
    // Get the path to the JSON file
    NSString *jsonFilePath = [[NSBundle mainBundle] pathForResource:@"certificate_settings"
                                                             ofType:@"json"
                                                        inDirectory:@"assets"];

    if (!jsonFilePath) {
        NSLog(@"JSON file not found.");
        return nil;
    }

    NSError *error;
    NSData *jsonData = [NSData dataWithContentsOfFile:jsonFilePath];

    if (!jsonData) {
        NSLog(@"Error reading JSON file.");
        return nil;
    }

    NSDictionary *jsonDict = [NSJSONSerialization JSONObjectWithData:jsonData
                                                             options:kNilOptions
                                                               error:&error];

    if (error || ![jsonDict isKindOfClass:[NSDictionary class]]) {
        NSLog(@"Error parsing JSON: %@", error.localizedDescription);
        return nil;
    }

    NSArray *pinned_domains = jsonDict[@"pinned_domains"];

    if (![pinned_domains isKindOfClass:[NSArray class]]) {
        NSLog(@"Error: 'pinned_domains' is not an array.");
        return nil;
    }

    return pinned_domains;
}

// Helper method to load a PEM certificate file and convert it to NSData
- (NSData *)loadCertificateFromFile:(NSString *)filePath {
    NSError *error;
    NSString *pemString = [NSString stringWithContentsOfFile:filePath encoding:NSUTF8StringEncoding error:&error];
    if (error) {
        NSLog(@"Error loading certificate from path: %@, error: %@", filePath, error.localizedDescription);
        return nil;
    }

    // Convert PEM string to NSData
    return [self convertPEMStringToNSData:pemString];
}

// Helper method to convert PEM string to NSData
- (NSData *)convertPEMStringToNSData:(NSString *)pemString {
    // Remove the PEM headers and footers
    NSString *strippedPem = [pemString stringByReplacingOccurrencesOfString:@"-----BEGIN CERTIFICATE-----" withString:@""];
    strippedPem = [strippedPem stringByReplacingOccurrencesOfString:@"-----END CERTIFICATE-----" withString:@""];

    // Remove any newline or carriage return characters
    strippedPem = [[strippedPem componentsSeparatedByCharactersInSet:[NSCharacterSet newlineCharacterSet]] componentsJoinedByString:@""];

    // Base64 decode the stripped string
    NSData *certData = [[NSData alloc] initWithBase64EncodedString:strippedPem options:NSDataBase64DecodingIgnoreUnknownCharacters];

    return certData;
}

- (void)setRequestSerializer:(NSString*)serializerName forManager:(AFHTTPSessionManager*)manager {
    if ([serializerName isEqualToString:@"json"]) {
        manager.requestSerializer = [AFJSONRequestSerializer serializer];
    } else if ([serializerName isEqualToString:@"utf8"]) {
        manager.requestSerializer = [TextRequestSerializer serializer];
    } else if ([serializerName isEqualToString:@"raw"]) {
        manager.requestSerializer = [BinaryRequestSerializer serializer];
    } else {
        manager.requestSerializer = [AFHTTPRequestSerializer serializer];
    }
}

- (BOOL)matchesPinnedDomain:(NSString *)domain withPinnedDomains:(NSArray<NSString *> *)pinnedDomains {
    for (NSString *pinnedDomain in pinnedDomains) {
        // Escape dots and replace wildcard with regex pattern
        NSString *regexPattern = [pinnedDomain stringByReplacingOccurrencesOfString:@"." withString:@"\\."];
        regexPattern = [regexPattern stringByReplacingOccurrencesOfString:@"*\\." withString:@".+"];

        // Create regex with case-insensitive matching
        NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:[NSString stringWithFormat:@"^%@$", regexPattern]
                                                                               options:NSRegularExpressionCaseInsensitive
                                                                                 error:nil];

        // Check if domain matches regex
        NSRange matchRange = [regex rangeOfFirstMatchInString:domain options:0 range:NSMakeRange(0, domain.length)];
        if (matchRange.location != NSNotFound) {
            return YES;
        }
    }
    return NO;
}

- (void)setupAuthChallengeBlock:(AFHTTPSessionManager*)manager {
    [manager setSessionDidReceiveAuthenticationChallengeBlock:^NSURLSessionAuthChallengeDisposition(
        NSURLSession * _Nonnull session,
        NSURLAuthenticationChallenge * _Nonnull challenge,
        NSURLCredential * _Nullable __autoreleasing * _Nullable credential
    ) {
        if ([challenge.protectionSpace.authenticationMethod isEqualToString: NSURLAuthenticationMethodServerTrust]) {

            // Extract the server's trust
            SecTrustRef serverTrust = challenge.protectionSpace.serverTrust;
            NSString *serverDomain = challenge.protectionSpace.host;

            // Retrieve the leaf certificate (index 0)
            SecCertificateRef leafCertificate = SecTrustGetCertificateAtIndex(serverTrust, 0);

            if (!leafCertificate) {
                // If there is no leaf certificate, reject the connection
                return NSURLSessionAuthChallengeCancelAuthenticationChallenge;
            }

            AFSecurityPolicy *previousPolicy = self->securityPolicy;

            // check if the settings contain the current domain. We only do certificate pinning if the domain is
            // actually pinned, otherwise, we just use the default mechanism to check the certificate chain
            if (![self matchesPinnedDomain:serverDomain withPinnedDomains:self->pinnedDomains]) {
                self->securityPolicy = [AFSecurityPolicy policyWithPinningMode:AFSSLPinningModeNone];
                self->securityPolicy.allowInvalidCertificates = NO;  // Ensure invalid certificates are not allowed
                self->securityPolicy.validatesDomainName = YES;
            }

            // Perform certificate pinning for root and intermediate certificates only if CN matches
            if (![self->securityPolicy evaluateServerTrust:serverTrust forDomain:serverDomain]) {
                self->securityPolicy = previousPolicy;
                return NSURLSessionAuthChallengeCancelAuthenticationChallenge;
            }

            self->securityPolicy = previousPolicy;


            // If all validations pass, use the credential
            *credential = [NSURLCredential credentialForTrust:serverTrust];
            return NSURLSessionAuthChallengeUseCredential;
        }

        // Handle client certificate challenges
        if ([challenge.protectionSpace.authenticationMethod isEqualToString: NSURLAuthenticationMethodClientCertificate] && self->x509Credential) {
            *credential = self->x509Credential;
            return NSURLSessionAuthChallengeUseCredential;
        }

        return NSURLSessionAuthChallengePerformDefaultHandling;
    }];
}

- (void)setRequestHeaders:(NSDictionary*)headers forManager:(AFHTTPSessionManager*)manager {
    [headers enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
        [manager.requestSerializer setValue:obj forHTTPHeaderField:key];
    }];
}

- (void)setXsrfHeader:(NSDictionary*)headers withMethod:(NSString*)method forManager:(AFHTTPSessionManager*)manager {
    NSArray *antiforgeryAffectedMethodes;
    antiforgeryAffectedMethodes = [NSArray arrayWithObjects:
    @"PUT",
    @"POST",
    @"DELETE",
    @"UPLOADFILES",
    @"DOWNLOADFILE", nil];
    if ([antiforgeryAffectedMethodes indexOfObject:method] != NSNotFound) {
        [headers enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
            if ([key isEqual:@"Cookie"] && [ obj rangeOfString:@"XSRF-TOKEN-CV" options:NSCaseInsensitiveSearch].location != NSNotFound) {
                NSArray *cookies = [obj componentsSeparatedByString:@";"];
                for (NSString *cookie in cookies) {
                    NSString *trimmed = [cookie stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
                    if ([trimmed hasPrefix:@"XSRF-TOKEN-CV"]) {
                        [manager.requestSerializer setValue:[trimmed componentsSeparatedByString:@"="].lastObject forHTTPHeaderField:@"X-XSRF-TOKEN-CV"];
                        return;
                    }
                }
            }
        }];
    }
}

- (void)setRedirect:(bool)followRedirect forManager:(AFHTTPSessionManager*)manager {
    [manager setTaskWillPerformHTTPRedirectionBlock:^NSURLRequest * _Nonnull(NSURLSession * _Nonnull session,
        NSURLSessionTask * _Nonnull task, NSURLResponse * _Nonnull response, NSURLRequest * _Nonnull request) {

        if (followRedirect) {
            return request;
        } else {
            return nil;
        }
    }];
}

- (void)setTimeout:(NSTimeInterval)timeout forManager:(AFHTTPSessionManager*)manager {
    [manager.requestSerializer setTimeoutInterval:timeout];
}

- (void)setResponseSerializer:(NSString*)responseType forManager:(AFHTTPSessionManager*)manager {
    if ([responseType isEqualToString: @"text"] || [responseType isEqualToString: @"json"]) {
        manager.responseSerializer = [TextResponseSerializer serializer];
    } else {
        manager.responseSerializer = [BinaryResponseSerializer serializer];
    }
}


- (void)handleSuccess:(NSMutableDictionary*)dictionary withResponse:(NSHTTPURLResponse*)response andData:(id)data {
    if (response != nil) {
        [dictionary setValue:response.URL.absoluteString forKey:@"url"];
        [dictionary setObject:[NSNumber numberWithInt:(int)response.statusCode] forKey:@"status"];
        [dictionary setObject:[self copyHeaderFields:response.allHeaderFields] forKey:@"headers"];
    }

    if (data != nil) {
        [dictionary setObject:data forKey:@"data"];
    }
}

- (void)handleError:(NSMutableDictionary*)dictionary withResponse:(NSHTTPURLResponse*)response error:(NSError*)error {
    if (response != nil) {
        [dictionary setValue:response.URL.absoluteString forKey:@"url"];
        [dictionary setObject:[NSNumber numberWithInt:(int)response.statusCode] forKey:@"status"];
        [dictionary setObject:[self copyHeaderFields:response.allHeaderFields] forKey:@"headers"];
        if (error.userInfo[AFNetworkingOperationFailingURLResponseBodyErrorKey]) {
            [dictionary setObject:error.userInfo[AFNetworkingOperationFailingURLResponseBodyErrorKey] forKey:@"error"];
        }
    } else {
        [dictionary setObject:[self getStatusCode:error] forKey:@"status"];
        [dictionary setObject:[error localizedDescription] forKey:@"error"];
    }
}

- (void)handleException:(NSException*)exception withCommand:(CDVInvokedUrlCommand*)command {
  CordovaHttpPlugin* __weak weakSelf = self;

  NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
  [dictionary setValue:exception.userInfo forKey:@"error"];
  [dictionary setObject:[NSNumber numberWithInt:-1] forKey:@"status"];

  CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
  [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (NSNumber*)getStatusCode:(NSError*) error {
    switch ([error code]) {
        case -1001:
            // timeout
            return [NSNumber numberWithInt:-4];
        case -1002:
            // unsupported URL
            return [NSNumber numberWithInt:-5];
        case -1003:
            // server not found
            return [NSNumber numberWithInt:-3];
        case -1009:
            // no connection
            return [NSNumber numberWithInt:-6];
        case -1200: // secure connection failed
        case -1201: // certificate has bad date
        case -1202: // certificate untrusted
        case -1203: // certificate has unknown root
        case -1204: // certificate is not yet valid
            // configuring SSL failed
            return [NSNumber numberWithInt:-2];
        default:
            return [NSNumber numberWithInt:-1];
    }
}

- (NSMutableDictionary*)copyHeaderFields:(NSDictionary *)headerFields {
    NSMutableDictionary *headerFieldsCopy = [[NSMutableDictionary alloc] initWithCapacity:headerFields.count];
    NSString *headerKeyCopy;

    for (NSString *headerKey in headerFields.allKeys) {
        headerKeyCopy = [[headerKey mutableCopy] lowercaseString];
        [headerFieldsCopy setValue:[headerFields objectForKey:headerKey] forKey:headerKeyCopy];
    }

    return headerFieldsCopy;
}

- (void)executeRequestWithoutData:(CDVInvokedUrlCommand*)command withMethod:(NSString*) method {
    AFHTTPSessionManager *manager = [AFHTTPSessionManager manager];

    NSString *url = [command.arguments objectAtIndex:0];
    NSDictionary *headers = [command.arguments objectAtIndex:1];
    NSTimeInterval timeoutInSeconds = [[command.arguments objectAtIndex:2] doubleValue];
    bool followRedirect = [[command.arguments objectAtIndex:3] boolValue];
    NSString *responseType = [command.arguments objectAtIndex:4];

    [self setRequestSerializer: @"default" forManager: manager];
    [self setupAuthChallengeBlock: manager];
    [self setRequestHeaders: headers forManager: manager];
    [self setXsrfHeader:headers withMethod:method forManager:manager];
    [self setTimeout:timeoutInSeconds forManager:manager];
    [self setRedirect:followRedirect forManager:manager];
    [self setResponseSerializer:responseType forManager:manager];

    CordovaHttpPlugin* __weak weakSelf = self;
    [[SDNetworkActivityIndicator sharedActivityIndicator] startActivity];

    @try {
        void (^onSuccess)(NSURLSessionTask *, id) = ^(NSURLSessionTask *task, id responseObject) {
            NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];

            // no 'body' for HEAD request, omitting 'data'
            if ([method isEqualToString:@"HEAD"]) {
                [self handleSuccess:dictionary withResponse:(NSHTTPURLResponse*)task.response andData:nil];
            } else {
                [self handleSuccess:dictionary withResponse:(NSHTTPURLResponse*)task.response andData:responseObject];
            }

            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:dictionary];
            [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        };

        void (^onFailure)(NSURLSessionTask *, NSError *) = ^(NSURLSessionTask *task, NSError *error) {
            NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
            [self handleError:dictionary withResponse:(NSHTTPURLResponse*)task.response error:error];

            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
            [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        };

        [manager downloadTaskWithHTTPMethod:method URLString:url parameters:nil progress:nil success:onSuccess failure:onFailure];
    }
    @catch (NSException *exception) {
        [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        [self handleException:exception withCommand:command];
    }
}

- (NSDictionary *)parseDictionary:(NSDictionary*)dict {
     if ([dict isKindOfClass:[NSDictionary class] ]) {
      for (NSString* key in [dict allKeys]) {
          @try {
              id value = dict[key];
              if ([value isKindOfClass:[NSDictionary class]]) {
                  [dict setValue:[self parseDictionary: value] forKey:key];
              } else if ([value isKindOfClass:[NSNumber class]] && strcmp([value objCType], @encode(double)) == 0) {
                  double dbl = [[dict objectForKey:key] doubleValue];
                  int digits = 6;
                  NSDecimalNumber *decimalNumber = (NSDecimalNumber*) [NSDecimalNumber numberWithDouble:dbl];
                  NSDecimalNumberHandler *behavior = [NSDecimalNumberHandler decimalNumberHandlerWithRoundingMode:NSRoundPlain scale:digits raiseOnExactness:NO raiseOnOverflow:NO raiseOnUnderflow:NO raiseOnDivideByZero:NO];
                  decimalNumber = [decimalNumber decimalNumberByRoundingAccordingToBehavior:behavior];
                  [dict setValue:decimalNumber forKey:key];
              }
          } @catch ( NSException *e ) {
              // do nothing
          }
      }
    }
    return dict;
}

- (void)executeRequestWithData:(CDVInvokedUrlCommand*)command withMethod:(NSString*)method {
    AFHTTPSessionManager *manager = [AFHTTPSessionManager manager];

    NSString *url = [command.arguments objectAtIndex:0];
    NSDictionary *data = [command.arguments objectAtIndex:1];
    NSString *serializerName = [command.arguments objectAtIndex:2];
    NSDictionary *headers = [command.arguments objectAtIndex:3];
    NSTimeInterval timeoutInSeconds = [[command.arguments objectAtIndex:4] doubleValue];
    bool followRedirect = [[command.arguments objectAtIndex:5] boolValue];
    NSString *responseType = [command.arguments objectAtIndex:6];

    // iterate over values and convert doubles in post body to decimal number
    data = [self parseDictionary: data];

    [self setRequestSerializer: serializerName forManager: manager];
    [self setupAuthChallengeBlock: manager];
    [self setRequestHeaders: headers forManager: manager];
    [self setXsrfHeader: headers withMethod:(NSString*)method forManager: manager];
    [self setTimeout:timeoutInSeconds forManager:manager];
    [self setRedirect:followRedirect forManager:manager];
    [self setResponseSerializer:responseType forManager:manager];
    CordovaHttpPlugin* __weak weakSelf = self;
    [[SDNetworkActivityIndicator sharedActivityIndicator] startActivity];

    @try {
        void (^constructBody)(id<AFMultipartFormData>) = ^(id<AFMultipartFormData> formData) {
            NSArray *buffers = [data mutableArrayValueForKey:@"buffers"];
            NSArray *fileNames = [data mutableArrayValueForKey:@"fileNames"];
            NSArray *names = [data mutableArrayValueForKey:@"names"];
            NSArray *types = [data mutableArrayValueForKey:@"types"];

            NSError *error;

            for (int i = 0; i < [buffers count]; ++i) {
                NSData *decodedBuffer = [[NSData alloc] initWithBase64EncodedString:[buffers objectAtIndex:i] options:0];
                NSString *fileName = [fileNames objectAtIndex:i];
                NSString *partName = [names objectAtIndex:i];
                NSString *partType = [types objectAtIndex:i];

                if (![fileName isEqual:[NSNull null]]) {
                    [formData appendPartWithFileData:decodedBuffer name:partName fileName:fileName mimeType:partType];
                } else {
                    [formData appendPartWithFormData:decodedBuffer name:[names objectAtIndex:i]];
                }
            }

            if (error) {
                NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
                [dictionary setObject:[NSNumber numberWithInt:400] forKey:@"status"];
                [dictionary setObject:@"Could not add part to multipart request body." forKey:@"error"];
                CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
                [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
                [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
                return;
            }
        };

        void (^onSuccess)(NSURLSessionTask *, id) = ^(NSURLSessionTask *task, id responseObject) {
            NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
            [self handleSuccess:dictionary withResponse:(NSHTTPURLResponse*)task.response andData:responseObject];

            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:dictionary];
            [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        };

        void (^onFailure)(NSURLSessionTask *, NSError *) = ^(NSURLSessionTask *task, NSError *error) {
            NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
            [self handleError:dictionary withResponse:(NSHTTPURLResponse*)task.response error:error];

            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
            [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        };

        if ([serializerName isEqualToString:@"multipart"]) {
            [manager uploadTaskWithHTTPMethod:method URLString:url parameters:nil constructingBodyWithBlock:constructBody progress:nil success:onSuccess failure:onFailure];
        } else {
            [manager uploadTaskWithHTTPMethod:method URLString:url parameters:data progress:nil success:onSuccess failure:onFailure];
        }
    }
    @catch (NSException *exception) {
        [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        [self handleException:exception withCommand:command];
    }
}

- (void)setServerTrustMode:(CDVInvokedUrlCommand*)command {
    NSString *certMode = [command.arguments objectAtIndex:0];

    if ([certMode isEqualToString: @"default"] || [certMode isEqualToString: @"legacy"]) {
        securityPolicy = [AFSecurityPolicy policyWithPinningMode:AFSSLPinningModeNone];
        securityPolicy.allowInvalidCertificates = NO;
        securityPolicy.validatesDomainName = YES;
    } else if ([certMode isEqualToString: @"nocheck"]) {
        securityPolicy = [AFSecurityPolicy policyWithPinningMode:AFSSLPinningModeNone];
        securityPolicy.allowInvalidCertificates = YES;
        securityPolicy.validatesDomainName = NO;
    } else if ([certMode isEqualToString: @"pinned"]) {
        securityPolicy = [AFSecurityPolicy policyWithPinningMode:AFSSLPinningModeCertificate];
        securityPolicy.allowInvalidCertificates = NO;
        securityPolicy.validatesDomainName = YES;
    }

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setClientAuthMode:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult;
    NSString *mode = [command.arguments objectAtIndex:0];

    if ([mode isEqualToString:@"none"]) {
      x509Credential = nil;
      pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    }

    if ([mode isEqualToString:@"systemstore"]) {
      NSString *alias = [command.arguments objectAtIndex:1];

      // TODO

      pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"mode 'systemstore' is not supported on iOS"];
    }

    if ([mode isEqualToString:@"buffer"]) {
        CFDataRef container = (__bridge CFDataRef) [command.arguments objectAtIndex:2];
        CFStringRef password = (__bridge CFStringRef) [command.arguments objectAtIndex:3];

        const void *keys[] = { kSecImportExportPassphrase };
        const void *values[] = { password };

        CFDictionaryRef options = CFDictionaryCreate(NULL, keys, values, 1, NULL, NULL);
        CFArrayRef items;
        OSStatus securityError = SecPKCS12Import(container, options, &items);
        CFRelease(options);

        if (securityError != noErr) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        } else {
            CFDictionaryRef identityDict = CFArrayGetValueAtIndex(items, 0);
            SecIdentityRef identity = (SecIdentityRef)CFDictionaryGetValue(identityDict, kSecImportItemIdentity);

            self->x509Credential = [NSURLCredential credentialWithIdentity:identity certificates: nil persistence:NSURLCredentialPersistenceForSession];
            CFRelease(items);

            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        }
    }

    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)post:(CDVInvokedUrlCommand*)command {
    [self executeRequestWithData: command withMethod:@"POST"];
}

- (void)put:(CDVInvokedUrlCommand*)command {
    [self executeRequestWithData: command withMethod:@"PUT"];
}

- (void)patch:(CDVInvokedUrlCommand*)command {
    [self executeRequestWithData: command withMethod:@"PATCH"];
}

- (void)get:(CDVInvokedUrlCommand*)command {
    [self executeRequestWithoutData: command withMethod:@"GET"];
}

- (void)delete:(CDVInvokedUrlCommand*)command {
    [self executeRequestWithoutData: command withMethod:@"DELETE"];
}

- (void)head:(CDVInvokedUrlCommand*)command {
    [self executeRequestWithoutData: command withMethod:@"HEAD"];
}

- (void)options:(CDVInvokedUrlCommand*)command {
    [self executeRequestWithoutData: command withMethod:@"OPTIONS"];
}

- (void)uploadFiles:(CDVInvokedUrlCommand*)command {
    AFHTTPSessionManager *manager = [AFHTTPSessionManager manager];

    NSString *url = [command.arguments objectAtIndex:0];
    NSDictionary *headers = [command.arguments objectAtIndex:1];
    NSArray *filePaths = [command.arguments objectAtIndex: 2];
    NSArray *names = [command.arguments objectAtIndex: 3];
    NSTimeInterval timeoutInSeconds = [[command.arguments objectAtIndex:4] doubleValue];
    bool followRedirect = [[command.arguments objectAtIndex:5] boolValue];
    NSString *responseType = [command.arguments objectAtIndex:6];

    [self setRequestHeaders: headers forManager: manager];
    [self setXsrfHeader:headers withMethod:@"UPLOADFILES" forManager:manager];
    [self setupAuthChallengeBlock: manager];
    [self setTimeout:timeoutInSeconds forManager:manager];
    [self setRedirect:followRedirect forManager:manager];
    [self setResponseSerializer:responseType forManager:manager];

    CordovaHttpPlugin* __weak weakSelf = self;
    [[SDNetworkActivityIndicator sharedActivityIndicator] startActivity];

    @try {
        [manager POST:url parameters:nil constructingBodyWithBlock:^(id<AFMultipartFormData> formData) {
            NSError *error;
            for (int i = 0; i < [filePaths count]; i++) {
                NSString *filePath = (NSString *) [filePaths objectAtIndex:i];
                NSString *uploadName = (NSString *) [names objectAtIndex:i];
                NSURL *fileURL = [NSURL URLWithString: filePath];
                [formData appendPartWithFileURL:fileURL name:uploadName error:&error];
            }
            if (error) {
                NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
                [dictionary setObject:[NSNumber numberWithInt:500] forKey:@"status"];
                [dictionary setObject:@"Could not add file to post body." forKey:@"error"];
                CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
                [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
                [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
                return;
            }
        } progress:nil success:^(NSURLSessionTask *task, id responseObject) {
            NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
            [self handleSuccess:dictionary withResponse:(NSHTTPURLResponse*)task.response andData:responseObject];

            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:dictionary];
            [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        } failure:^(NSURLSessionTask *task, NSError *error) {
            NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
            [self handleError:dictionary withResponse:(NSHTTPURLResponse*)task.response error:error];

            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
            [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        }];
    }
    @catch (NSException *exception) {
        [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        [self handleException:exception withCommand:command];
    }
}

- (void)downloadFile:(CDVInvokedUrlCommand*)command {
    AFHTTPSessionManager *manager = [AFHTTPSessionManager manager];
    manager.responseSerializer = [AFHTTPResponseSerializer serializer];

    NSString *url = [command.arguments objectAtIndex:0];
    NSDictionary *headers = [command.arguments objectAtIndex:1];
    NSString *filePath = [command.arguments objectAtIndex: 2];
    NSTimeInterval timeoutInSeconds = [[command.arguments objectAtIndex:3] doubleValue];
    bool followRedirect = [[command.arguments objectAtIndex:4] boolValue];

    [self setRequestHeaders: headers forManager: manager];
    [self setXsrfHeader:headers withMethod:@"DOWNLOADFILE" forManager:manager];
    [self setupAuthChallengeBlock: manager];
    [self setTimeout:timeoutInSeconds forManager:manager];
    [self setRedirect:followRedirect forManager:manager];

    if ([filePath hasPrefix:@"file://"]) {
        filePath = [filePath substringFromIndex:7];
    }

    CordovaHttpPlugin* __weak weakSelf = self;
    [[SDNetworkActivityIndicator sharedActivityIndicator] startActivity];

    @try {
        [manager GET:url parameters:nil progress: nil success:^(NSURLSessionTask *task, id responseObject) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             * Modified by Andrew Stephan for Sync OnSet
             *
             */
            // Download response is okay; begin streaming output to file
            NSString* parentPath = [filePath stringByDeletingLastPathComponent];

            // create parent directories if needed
            NSError *error;
            if ([[NSFileManager defaultManager] createDirectoryAtPath:parentPath withIntermediateDirectories:YES attributes:nil error:&error] == NO) {
                NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
                [dictionary setObject:[NSNumber numberWithInt:500] forKey:@"status"];
                if (error) {
                    [dictionary setObject:[NSString stringWithFormat:@"Could not create path to save downloaded file: %@", [error localizedDescription]] forKey:@"error"];
                } else {
                    [dictionary setObject:@"Could not create path to save downloaded file" forKey:@"error"];
                }
                CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
                [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
                [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
                return;
            }
            NSData *data = (NSData *)responseObject;
            if (![data writeToFile:filePath atomically:YES]) {
                NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
                [dictionary setObject:[NSNumber numberWithInt:500] forKey:@"status"];
                [dictionary setObject:@"Could not write the data to the given filePath." forKey:@"error"];
                CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
                [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
                [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
                return;
            }

            id filePlugin = [self.commandDelegate getCommandInstance:@"File"];
            NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
            [self handleSuccess:dictionary withResponse:(NSHTTPURLResponse*)task.response andData:nil];
            [dictionary setObject:[filePlugin getDirectoryEntry:filePath isDirectory:NO] forKey:@"file"];

            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:dictionary];
            [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        } failure:^(NSURLSessionTask *task, NSError *error) {
            NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
            [self handleError:dictionary withResponse:(NSHTTPURLResponse*)task.response error:error];
            [dictionary setObject:@"There was an error downloading the file" forKey:@"error"];

            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
            [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        }];
    }
    @catch (NSException *exception) {
        [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];
        [self handleException:exception withCommand:command];
    }
}

@end
