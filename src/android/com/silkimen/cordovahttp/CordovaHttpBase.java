package com.silkimen.cordovahttp;

import java.io.ByteArrayOutputStream;

import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

import java.nio.ByteBuffer;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLHandshakeException;
import javax.net.ssl.SSLSocketFactory;

import com.silkimen.http.HttpBodyDecoder;
import com.silkimen.http.HttpRequest;
import com.silkimen.http.HttpRequest.HttpRequestException;
import com.silkimen.http.JsonUtils;
import com.silkimen.http.OkConnectionFactory;

import org.apache.cordova.CallbackContext;

import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

abstract class CordovaHttpBase implements Runnable {
  protected static final String TAG = "Cordova-Plugin-HTTP";

  protected String method;
  protected String url;
  protected String serializer = "none";
  protected Object data;
  protected JSONObject headers;
  protected int timeout;
  protected boolean followRedirects;
  protected SSLSocketFactory customSSLSocketFactory;
  protected HostnameVerifier customHostnameVerifier;
  protected CallbackContext callbackContext;

  public CordovaHttpBase(String method, String url, String serializer, Object data, JSONObject headers, int timeout,
      boolean followRedirects, SSLSocketFactory customSSLSocketFactory, HostnameVerifier customHostnameVerifier,
      CallbackContext callbackContext) {

    this.method = method;
    this.url = url;
    this.serializer = serializer;
    this.data = data;
    this.headers = headers;
    this.timeout = timeout;
    this.followRedirects = followRedirects;
    this.customSSLSocketFactory = customSSLSocketFactory;
    this.customHostnameVerifier = customHostnameVerifier;
    this.callbackContext = callbackContext;
  }

  public CordovaHttpBase(String method, String url, JSONObject headers, int timeout,
      boolean followRedirects, SSLSocketFactory customSSLSocketFactory, HostnameVerifier customHostnameVerifier,
      CallbackContext callbackContext) {

    this.method = method;
    this.url = url;
    this.headers = headers;
    this.timeout = timeout;
    this.followRedirects = followRedirects;
    this.customSSLSocketFactory = customSSLSocketFactory;
    this.customHostnameVerifier = customHostnameVerifier;
    this.callbackContext = callbackContext;
  }

  @Override
  public void run() {
    CordovaHttpResponse response = new CordovaHttpResponse();

    try {
      HttpRequest request = this.createRequest();
      this.prepareRequest(request);
      this.sendBody(request);
      this.processResponse(request, response);
    } catch (HttpRequestException e) {
      if (e.getCause() instanceof SSLHandshakeException) {
        response.setStatus(-2);
        response.setErrorMessage("SSL handshake failed: " + e.getMessage());
        Log.w(TAG, "SSL handshake failed", e);
      } else if (e.getCause() instanceof UnknownHostException) {
        response.setStatus(-3);
        response.setErrorMessage("Host could not be resolved: " + e.getMessage());
        Log.w(TAG, "Host could not be resolved", e);
      } else if (e.getCause() instanceof SocketTimeoutException) {
        response.setStatus(-4);
        response.setErrorMessage("Request timed out: " + e.getMessage());
        Log.w(TAG, "Request timed out", e);
      } else {
        response.setStatus(-1);
        response.setErrorMessage("There was an error with the request: " + e.getCause().getMessage());
        Log.w(TAG, "Generic request error", e);
      }
    } catch (Exception e) {
      response.setStatus(-1);
      response.setErrorMessage(e.getMessage());
      Log.e(TAG, "An unexpected error occured", e);
    }

    try {
      if (response.hasFailed()) {
        this.callbackContext.error(response.toJSON());
      } else {
        this.callbackContext.success(response.toJSON());
      }
    } catch (JSONException e) {
      Log.e(TAG, "An unexpected error occured while creating HTTP response object", e);
    }
  }

  protected HttpRequest createRequest() throws JSONException {
    return new HttpRequest(this.url, this.method);
  }

  protected void prepareRequest(HttpRequest request) throws JSONException {
    request.followRedirects(this.followRedirects);
    request.readTimeout(this.timeout);
    request.acceptCharset("UTF-8");
    request.uncompress(true);
    request.setConnectionFactory(new OkConnectionFactory());

    if (this.customHostnameVerifier != null) {
      request.setHostnameVerifier(this.customHostnameVerifier);
    }

    if (this.customSSLSocketFactory != null) {
      request.setSSLSocketFactory(this.customSSLSocketFactory);
    }

    // setup content type before applying headers, so user can override it
    this.setContentType(request);

    request.headers(JsonUtils.getStringMap(this.headers));
  }

  protected void setContentType(HttpRequest request) {
    switch (this.serializer) {
    case "json":
      request.contentType("application/json", "UTF-8");
      break;
    case "utf8":
      request.contentType("text/plain", "UTF-8");
      break;
    case "urlencoded":
      // intentionally left blank, because content type is set in HttpRequest.form()
      break;
    }
  }

  protected void sendBody(HttpRequest request) throws Exception {
    if (this.data == null) {
      return;
    }

    switch (this.serializer) {
    case "json":
      request.send(this.data.toString());
      break;
    case "utf8":
      request.send(((JSONObject) this.data).getString("text"));
      break;
    case "urlencoded":
      request.form(JsonUtils.getObjectMap((JSONObject) this.data));
      break;
    }
  }

  protected void processResponse(HttpRequest request, CordovaHttpResponse response) throws Exception {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    request.receive(outputStream);

    ByteBuffer rawOutput = ByteBuffer.wrap(outputStream.toByteArray());
    String decodedBody = HttpBodyDecoder.decodeBody(rawOutput, request.charset());

    response.setStatus(request.code());
    response.setUrl(request.url().toString());
    response.setHeaders(request.headers());

    if (request.code() >= 200 && request.code() < 300) {
      response.setBody(decodedBody);
    } else {
      response.setErrorMessage(decodedBody);
    }
  }
}
