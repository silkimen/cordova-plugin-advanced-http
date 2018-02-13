#import <Foundation/Foundation.h>
#import "AFURLResponseSerialization.h"

@interface TextResponseSerializer : AFHTTPResponseSerializer

+ (instancetype)serializer;

FOUNDATION_EXPORT NSString * const AFNetworkingOperationFailingURLResponseBodyKey;

@end
