#import "CordovaHTTP.h"
#import "CDVFile.h"
#import "TextResponseSerializer.h"
#import "HTTPManager.h"

@implementation CordovaHTTP

- (void) setAuthorizationHeaderWithUsernameAndPassword:(CDVInvokedUrlCommand*)command {
    NSString *username = [command.arguments objectAtIndex:0];
    NSString *password = [command.arguments objectAtIndex:1];
    
    [[HTTPManager sharedClient].requestSerializer setAuthorizationHeaderFieldWithUsername:username password:password];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) setHeader:(CDVInvokedUrlCommand*)command {
    NSString *header = [command.arguments objectAtIndex:0];
    NSString *value = [command.arguments objectAtIndex:1];
    
    [[HTTPManager sharedClient].requestSerializer setValue:value forHTTPHeaderField: header];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) setSSLPinningMode:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = nil;
    int pinningMode = [[command.arguments objectAtIndex:0] integerValue];
    
    if (pinningMode == 0) {
        [HTTPManager sharedClient].securityPolicy.SSLPinningMode = AFSSLPinningModeNone;
    } else if (pinningMode == 1) {
        [HTTPManager sharedClient].securityPolicy = [AFSecurityPolicy policyWithPinningMode:AFSSLPinningModeCertificate];
    } else if (pinningMode == 2) {
        [HTTPManager sharedClient].securityPolicy = [AFSecurityPolicy policyWithPinningMode:AFSSLPinningModePublicKey];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Requested SSL Pinning Mode is Unknown"];
    }
    
    if (pluginResult == nil) {
      pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    }
    
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)validateEntireCertificateChain:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = nil;
    bool validate = [[command.arguments objectAtIndex:0] boolValue];
    
    [HTTPManager sharedClient].securityPolicy.validatesCertificateChain = validate;
    
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)allowInvalidCertificates:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = nil;
    bool allow = [[command.arguments objectAtIndex:0] boolValue];
    
    [HTTPManager sharedClient].securityPolicy.allowInvalidCertificates = allow;
    
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)acceptText:(CDVInvokedUrlCommand*)command {
    [HTTPManager sharedClient].responseSerializer = [TextResponseSerializer serializer];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)acceptData:(CDVInvokedUrlCommand*)command {
    [HTTPManager sharedClient].responseSerializer = [AFHTTPResponseSerializer serializer];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setAcceptableContentTypes:(CDVInvokedUrlCommand*)command {
    [HTTPManager sharedClient].responseSerializer.acceptableContentTypes = [NSSet setWithArray: command.arguments];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)post:(CDVInvokedUrlCommand*)command {
   HTTPManager *manager = [HTTPManager sharedClient];
   NSString *url = [command.arguments objectAtIndex:0];
   NSDictionary *parameters = [command.arguments objectAtIndex:1];
   
   CordovaHTTP* __weak weakSelf = self;
   
   [manager POST:url parameters:parameters success:^(AFHTTPRequestOperation *operation, id responseObject) {
      NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
      [dictionary setObject:[NSNumber numberWithInt:operation.response.statusCode] forKey:@"status"];
      [dictionary setObject:responseObject forKey:@"data"];
      CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:dictionary];
      [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
   } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
      NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
      [dictionary setObject:[NSNumber numberWithInt:operation.response.statusCode] forKey:@"status"];
      [dictionary setObject:[error localizedDescription] forKey:@"error"];
      CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
      [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
   }];
}

- (void)get:(CDVInvokedUrlCommand*)command {
   HTTPManager *manager = [HTTPManager sharedClient];
   NSString *url = [command.arguments objectAtIndex:0];
   NSDictionary *parameters = [command.arguments objectAtIndex:1];
   
   CordovaHTTP* __weak weakSelf = self;
   
   [manager GET:url parameters:parameters success:^(AFHTTPRequestOperation *operation, id responseObject) {
      NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
      [dictionary setObject:[NSNumber numberWithInt:operation.response.statusCode] forKey:@"status"];
      [dictionary setObject:responseObject forKey:@"data"];
      CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:dictionary];
      [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
   } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
      NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
      [dictionary setObject:[NSNumber numberWithInt:operation.response.statusCode] forKey:@"status"];
      [dictionary setObject:[error localizedDescription] forKey:@"error"];
      CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
      [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
   }];
}

- (void)uploadFile:(CDVInvokedUrlCommand*)command {
    HTTPManager *manager = [HTTPManager sharedClient];
    NSString *url = [command.arguments objectAtIndex:0];
    NSDictionary *parameters = [command.arguments objectAtIndex:1];
    NSString *filePath = [command.arguments objectAtIndex: 2];
    NSString *name = [command.arguments objectAtIndex: 3];
    
    NSURL *fileURL = [NSURL fileURLWithPath: filePath];
    
    CordovaHTTP* __weak weakSelf = self;
    [manager POST:url parameters:parameters constructingBodyWithBlock:^(id<AFMultipartFormData> formData) {
        NSError *error;
        [formData appendPartWithFileURL:fileURL name:name error:&error];
        if (error) {
            NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
            [dictionary setObject:[NSNumber numberWithInt:500] forKey:@"status"];
            [dictionary setObject:@"Could not add image to post body." forKey:@"error"];
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
            [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        }
    } success:^(AFHTTPRequestOperation *operation, id responseObject) {
        NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
        [dictionary setObject:[NSNumber numberWithInt:operation.response.statusCode] forKey:@"status"];
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:dictionary];
        [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
        NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
        [dictionary setObject:[NSNumber numberWithInt:operation.response.statusCode] forKey:@"status"];
        [dictionary setObject:[error localizedDescription] forKey:@"error"];
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
        [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}


- (void)downloadFile:(CDVInvokedUrlCommand*)command {
    HTTPManager *manager = [HTTPManager sharedClient];
    NSString *url = [command.arguments objectAtIndex:0];
    NSDictionary *parameters = [command.arguments objectAtIndex:1];
    NSString *filePath = [command.arguments objectAtIndex: 2];
   
    CordovaHTTP* __weak weakSelf = self;
    [manager GET:url parameters:parameters success:^(AFHTTPRequestOperation *operation, id responseObject) {
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
            return;
        }
        NSData *data = (NSData *)responseObject;
        if (![data writeToFile:filePath atomically:YES]) {
            NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
            [dictionary setObject:[NSNumber numberWithInt:500] forKey:@"status"];
            [dictionary setObject:@"Could not write the data to the given filePath." forKey:@"error"];
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
            [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        }
   
        CDVFile *file = [[CDVFile alloc] init];
        NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
        [dictionary setObject:[NSNumber numberWithInt:operation.response.statusCode] forKey:@"status"];
        [dictionary setObject:[file getDirectoryEntry:filePath isDirectory:NO] forKey:@"file"];
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:dictionary];
        [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
        NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
        [dictionary setObject:[NSNumber numberWithInt:operation.response.statusCode] forKey:@"status"];
        [dictionary setObject:[error localizedDescription] forKey:@"error"];
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:dictionary];
        [weakSelf.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

@end
