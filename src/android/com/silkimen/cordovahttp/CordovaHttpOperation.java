package com.silkimen.cordovahttp;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLSocketFactory;

import com.silkimen.http.TLSConfiguration;

import org.apache.cordova.CallbackContext;
import org.json.JSONObject;

class CordovaHttpOperation extends CordovaHttpBase {
  public CordovaHttpOperation(String method, String url, String serializer, Object data, JSONObject headers,
      int timeout, boolean followRedirects, String responseType, TLSConfiguration tlsConfiguration,
      CallbackContext callbackContext) {

    super(method, url, serializer, data, headers, timeout, followRedirects, responseType, tlsConfiguration,
        callbackContext);
  }

  public CordovaHttpOperation(String method, String url, JSONObject headers, int timeout, boolean followRedirects,
      String responseType, TLSConfiguration tlsConfiguration, CallbackContext callbackContext) {

    super(method, url, headers, timeout, followRedirects, responseType, tlsConfiguration, callbackContext);
  }
}
