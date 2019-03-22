package com.silkimen.cordovahttp;

import javax.net.ssl.SSLSocketFactory;

import org.apache.cordova.CallbackContext;
import org.json.JSONObject;

class CordovaHttpOperation extends CordovaHttpBase {
  public CordovaHttpOperation(String method, String url, String serializer, Object data, JSONObject headers,
      int timeout, boolean followRedirects, SSLSocketFactory customSSLSocketFactory, CallbackContext callbackContext) {

    super(method, url, serializer, data, headers, timeout, followRedirects, customSSLSocketFactory, callbackContext);
  }

  public CordovaHttpOperation(String method, String url, JSONObject params, JSONObject headers, int timeout,
      boolean followRedirects, SSLSocketFactory customSSLSocketFactory, CallbackContext callbackContext) {

    super(method, url, params, headers, timeout, followRedirects, customSSLSocketFactory, callbackContext);
  }
}
