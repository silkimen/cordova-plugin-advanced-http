#import <Foundation/Foundation.h>
#import "AFURLResponseSerialization.h"

@interface BinaryResponseSerializer : AFHTTPResponseSerializer

+ (instancetype)serializer;

@end
