/*
 * This file is part of the SDNetworkActivityIndicator package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import <UIKit/UIKit.h>
#import "SDNetworkActivityIndicator.h"

@interface SDNetworkActivityIndicator()
{
    @private NSUInteger counter;
}
@end


@implementation SDNetworkActivityIndicator

+ (instancetype) sharedActivityIndicator
{
    static id _sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _sharedInstance = [[self alloc] init];
    });
    
    return _sharedInstance;
}

- (id)init
{
    if ((self = [super init]))
    {
        counter = 0;
    }

    return self;
}

- (void)startActivity
{
    @synchronized(self)
    {
        counter++;
        [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:YES];
    }
}

- (void)stopActivity
{
    @synchronized(self)
    {
        if (counter > 0 && --counter == 0)
        {
            [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:NO];
        }
    }
}

- (void)stopAllActivity
{
    @synchronized(self)
    {
        counter = 0;
        [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:NO];
    }
}

@end
