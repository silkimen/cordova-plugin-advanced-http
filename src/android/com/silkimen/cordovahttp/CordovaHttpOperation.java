package com.silkimen.cordovahttp;

import org.apache.cordova.CallbackContext;
import org.json.JSONObject;

class CordovaHttpOperation extends CordovaHttpBase {
  public CordovaHttpOperation(String method, String url, String serializer, Object data, JSONObject headers,
      int timeout, CallbackContext callbackContext) {

    super(method, url, serializer, data, headers, timeout, callbackContext);
  }

  public CordovaHttpOperation(String method, String url, JSONObject params, JSONObject headers, int timeout,
      CallbackContext callbackContext) {

    super(method, url, params, headers, timeout, callbackContext);
  }
}
