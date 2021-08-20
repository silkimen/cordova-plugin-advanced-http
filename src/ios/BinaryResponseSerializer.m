#import "BinaryResponseSerializer.h"

static NSError * AFErrorWithUnderlyingError(NSError *error, NSError *underlyingError) {
  if (!error) {
    return underlyingError;
  }

  if (!underlyingError || error.userInfo[NSUnderlyingErrorKey]) {
    return error;
  }

  NSMutableDictionary *mutableUserInfo = [error.userInfo mutableCopy];
  mutableUserInfo[NSUnderlyingErrorKey] = underlyingError;

  return [[NSError alloc] initWithDomain:error.domain code:error.code userInfo:mutableUserInfo];
}

static BOOL AFErrorOrUnderlyingErrorHasCodeInDomain(NSError *error, NSInteger code, NSString *domain) {
  if ([error.domain isEqualToString:domain] && error.code == code) {
    return YES;
  } else if (error.userInfo[NSUnderlyingErrorKey]) {
    return AFErrorOrUnderlyingErrorHasCodeInDomain(error.userInfo[NSUnderlyingErrorKey], code, domain);
  }

  return NO;
}

@implementation BinaryResponseSerializer

+ (instancetype)serializer {
  BinaryResponseSerializer *serializer = [[self alloc] init];
  return serializer;
}

- (instancetype)init {
  self = [super init];

  if (!self) {
    return nil;
  }

  self.acceptableContentTypes = nil;

  return self;
}

- (NSString*)decodeResponseData:(NSData*)rawResponseData withEncoding:(CFStringEncoding)cfEncoding {
  NSStringEncoding nsEncoding;
  NSString* decoded = nil;

  if (cfEncoding != kCFStringEncodingInvalidId) {
    nsEncoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
  }

  NSStringEncoding supportedEncodings[6] = {
    NSUTF8StringEncoding, NSWindowsCP1252StringEncoding, NSISOLatin1StringEncoding,
    NSISOLatin2StringEncoding, NSASCIIStringEncoding, NSUnicodeStringEncoding
  };

  for (int i = 0; i < sizeof(supportedEncodings) / sizeof(NSStringEncoding) && !decoded; ++i) {
    if (cfEncoding == kCFStringEncodingInvalidId || nsEncoding == supportedEncodings[i]) {
      decoded = [[NSString alloc] initWithData:rawResponseData encoding:supportedEncodings[i]];
    }
  }

  return decoded;
}

- (CFStringEncoding) getEncoding:(NSURLResponse *)response {
  CFStringEncoding encoding = kCFStringEncodingInvalidId;

  if (response.textEncodingName) {
    encoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
  }

  return encoding;
}

#pragma mark -

- (BOOL)validateResponse:(NSHTTPURLResponse *)response
                    data:(NSData *)data
                   error:(NSError * __autoreleasing *)error
{
  if (response && [response isKindOfClass:[NSHTTPURLResponse class]]) {
    if (self.acceptableStatusCodes && ![self.acceptableStatusCodes containsIndex:(NSUInteger)response.statusCode] && [response URL]) {
      NSMutableDictionary *mutableUserInfo = [@{
        NSLocalizedDescriptionKey: [NSString stringWithFormat:NSLocalizedStringFromTable(@"Request failed: %@ (%ld)", @"SM_AFNetworking", nil), [NSHTTPURLResponse localizedStringForStatusCode:response.statusCode], (long)response.statusCode],
        NSURLErrorFailingURLErrorKey: [response URL],
        SM_AFNetworkingOperationFailingURLResponseErrorKey: response,
      } mutableCopy];

      if (data) {
        mutableUserInfo[SM_AFNetworkingOperationFailingURLResponseDataErrorKey] = data;

        // trying to decode error message in body
        mutableUserInfo[SM_AFNetworkingOperationFailingURLResponseBodyErrorKey] = [self decodeResponseData:data withEncoding:[self getEncoding:response]];
      }

      if (error) {
        *error = [NSError errorWithDomain:SM_AFURLResponseSerializationErrorDomain code:NSURLErrorBadServerResponse userInfo:mutableUserInfo];
      }

      return NO;
    }
  }

  return YES;
}

#pragma mark - SM_AFURLResponseSerialization

- (id)responseObjectForResponse:(NSURLResponse *)response
                           data:(NSData *)data
                          error:(NSError *__autoreleasing *)error
{
  if (![self validateResponse:(NSHTTPURLResponse *)response data:data error:error]) {
    if (!error || AFErrorOrUnderlyingErrorHasCodeInDomain(*error, NSURLErrorCannotDecodeContentData, SM_AFURLResponseSerializationErrorDomain)) {
      return nil;
    }
  }

  return [data base64EncodedStringWithOptions:0];
}

@end
