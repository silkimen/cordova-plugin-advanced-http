package com.silkimen.cordovahttp;

import java.io.ByteArrayOutputStream;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;

import javax.net.ssl.SSLHandshakeException;

import com.silkimen.http.HttpBodyDecoder;
import com.silkimen.http.HttpRequest;
import com.silkimen.http.HttpRequest.HttpRequestException;
import com.silkimen.http.HttpResponse;
import com.silkimen.http.JsonUtils;

import org.apache.cordova.CallbackContext;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

public class CordovaHttpRequest implements Runnable {
  private String method;
  private String url;
  private String serializer = "none";
  private Object data;
  private JSONObject params;
  private JSONObject headers;
  private int timeout;
  private CallbackContext callbackContext;

  public CordovaHttpRequest(String method, String url, String serializer, Object data, JSONObject headers,
      int timeout, CallbackContext callbackContext) {

    this.method = method;
    this.url = url;
    this.serializer = serializer;
    this.data = data;
    this.headers = headers;
    this.timeout = timeout;
    this.callbackContext = callbackContext;
  }

  public CordovaHttpRequest(String method, String url, JSONObject params, JSONObject headers, int timeout,
      CallbackContext callbackContext) {

    this.method = method;
    this.url = url;
    this.params = params;
    this.headers = headers;
    this.timeout = timeout;
    this.callbackContext = callbackContext;
  }

  @Override
  public void run() {
    HttpResponse response = new HttpResponse();

    try {
      String processedUrl = HttpRequest.encode(HttpRequest.append(this.url, JsonUtils.getObjectMap(this.params)));
      ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

      HttpRequest request = new HttpRequest(processedUrl, this.method)
          .followRedirects(true /* @TODO */)
          .readTimeout(this.timeout)
          .acceptCharset("UTF-8")
          .uncompress(true);

      // setup content type before applying headers, so user can override it
      this.setContentType(request)
          .headers(JsonUtils.getStringMap(this.headers));

      this.sendBody(request)
          .receive(outputStream);

      ByteBuffer rawOutput = ByteBuffer.wrap(outputStream.toByteArray());
      String decodedBody = HttpBodyDecoder.decodeBody(rawOutput, request.charset());

      response.setStatus(request.code());
      response.setUrl(request.url().toString());
      response.setHeaders(request.headers());

      if (request.code() >= 200 && request.code() < 300) {
        response.setBody(decodedBody);
        this.callbackContext.success(response.toJSON());
      } else {
        response.setErrorMessage(decodedBody);
        this.callbackContext.error(response.toJSON());
      }
    } catch (HttpRequestException e) {
      if (e.getCause() instanceof SSLHandshakeException) {
        response.setStatus(-2);
        response.setErrorMessage("SSL handshake failed: " + e.getMessage());
        Log.w("Cordova-Plugin-HTTP", "SSL handshake failed", e);
      } else if (e.getCause() instanceof UnknownHostException) {
        response.setStatus(-3);
        response.setErrorMessage("Host could not be resolved: " + e.getMessage());
        Log.w("Cordova-Plugin-HTTP", "Host could not be resolved", e);
      } else if (e.getCause() instanceof SocketTimeoutException) {
        response.setStatus(-4);
        response.setErrorMessage("Request timed out: " + e.getMessage());
        Log.w("Cordova-Plugin-HTTP", "Request timed out", e);
      } else {
        response.setStatus(-1);
        response.setErrorMessage("There was an error with the request: " + e.getCause().getMessage());
        Log.w("Cordova-Plugin-HTTP", "Generic request error", e);
      }
    } catch (Exception e) {
      response.setStatus(-1);
      response.setErrorMessage(e.getMessage());
      Log.e("Cordova-Plugin-HTTP", "An unexpected error occured", e);
    }

    try {
      if (response.hasFailed()) {
        this.callbackContext.error(response.toJSON());
      } else {
        this.callbackContext.success(response.toJSON());
      }
    } catch (JSONException e) {
      Log.e("Cordova-Plugin-HTTP", "An unexpected error occured while processing HTTP response", e);
    }
  }

  private HttpRequest setContentType(HttpRequest request) {
    switch(this.serializer) {
      case "json":
        return request.contentType("application/json", "UTF-8");
      case "utf8":
        return request.contentType("text/plain", "UTF-8");
      case "urlencoded":
        // intentionally left blank, because content type is set in HttpRequest.form()
    }

    return request;
  }

  private HttpRequest sendBody(HttpRequest request) throws JSONException {
    if (this.data == null) {
      return request;
    }

    switch (this.serializer) {
      case "json":
        return request.send(this.data.toString());
      case "utf8":
        return request.send(((JSONObject) this.data).getString("text"));
      case "urlencoded":
        return request.form(JsonUtils.getObjectMap((JSONObject) this.data));
    }

    return request;
  }
}
