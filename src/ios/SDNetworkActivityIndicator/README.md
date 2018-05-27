# SDNetworkActivityIndicator

Handle showing / hiding of the iOS network activity indicator to allow multiple concurrent threads to show / hide the indicator such that the indicator remains visible until all the requests have completed and requested the indicator to be hidden.

## Requirements

* iOS 5.0 or later.
* ARC memory management.

## Installation

The easiest way to install it is by copying the following files to your project:

* SDNetworkActivityIndicator.h
* SDNetworkActivityIndicator.m

## Usage

* When you start a network activity (will show the network activity indicator):

        [[SDNetworkActivityIndicator sharedActivityIndicator] startActivity];

* When you finish a network activity (will hide the network activity indicator only if the number of calls to `stopActivity` matches the number of calls to `startActivity`):

        [[SDNetworkActivityIndicator sharedActivityIndicator] stopActivity];

* To hide the network activity indicator regardless of whether all activities have finished (without having to call `stopActivity` for each `startActivity` called):

        [[SDNetworkActivityIndicator sharedActivityIndicator] stopAllActivity];


## License
Copyright (c) 2010 Olivier Poitrey <rs@dailymotion.com>
 
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

