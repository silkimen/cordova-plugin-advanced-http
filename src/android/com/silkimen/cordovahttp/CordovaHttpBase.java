package com.silkimen.cordovahttp;

import java.io.IOException;
import java.io.ByteArrayOutputStream;

import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

import java.nio.ByteBuffer;

import javax.net.ssl.SSLException;

import com.silkimen.http.HttpBodyDecoder;
import com.silkimen.http.HttpRequest;
import com.silkimen.http.HttpRequest.HttpRequestException;
import com.silkimen.http.JsonUtils;
import com.silkimen.http.OkConnectionFactory;
import com.silkimen.http.TLSConfiguration;

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
  protected TLSConfiguration tlsConfiguration;
  protected CallbackContext callbackContext;

  public CordovaHttpBase(String method, String url, String serializer, Object data, JSONObject headers, int timeout,
      boolean followRedirects, TLSConfiguration tlsConfiguration, CallbackContext callbackContext) {

    this.method = method;
    this.url = url;
    this.serializer = serializer;
    this.data = data;
    this.headers = headers;
    this.timeout = timeout;
    this.followRedirects = followRedirects;
    this.tlsConfiguration = tlsConfiguration;
    this.callbackContext = callbackContext;
  }

  public CordovaHttpBase(String method, String url, JSONObject headers, int timeout, boolean followRedirects,
      TLSConfiguration tlsConfiguration, CallbackContext callbackContext) {

    this.method = method;
    this.url = url;
    this.headers = headers;
    this.timeout = timeout;
    this.followRedirects = followRedirects;
    this.tlsConfiguration = tlsConfiguration;
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
      if (e.getCause() instanceof SSLException) {
        response.setStatus(-2);
        response.setErrorMessage("TLS connection could not be established: " + e.getMessage());
        Log.w(TAG, "TLS connection could not be established", e);
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

  protected void prepareRequest(HttpRequest request) throws JSONException, IOException {
    request.followRedirects(this.followRedirects);
    request.readTimeout(this.timeout);
    request.acceptCharset("UTF-8");
    request.uncompress(true);
    request.setConnectionFactory(new OkConnectionFactory());

    if (this.tlsConfiguration.getHostnameVerifier() != null) {
      request.setHostnameVerifier(this.tlsConfiguration.getHostnameVerifier());
    }

    request.setSSLSocketFactory(this.tlsConfiguration.getTLSSocketFactory());

    // setup content type before applying headers, so user can override it
    this.setContentType(request);

    request.headers(JsonUtils.getStringMap(this.headers));
  }

  protected void setContentType(HttpRequest request) {
    if ("json".equals(this.serializer)) {
      request.contentType("application/json", "UTF-8");
    } else if ("utf8".equals(this.serializer)) {
      request.contentType("text/plain", "UTF-8");
    } else if ("urlencoded".equals(this.serializer)) {
      // intentionally left blank, because content type is set in HttpRequest.form()
    }
  }

  protected void sendBody(HttpRequest request) throws Exception {
    if (this.data == null) {
      return;
    }

    if ("json".equals(this.serializer)) {
      request.send(this.data.toString());
    } else if ("utf8".equals(this.serializer)) {
      request.send(((JSONObject) this.data).getString("text"));
    } else if ("urlencoded".equals(this.serializer)) {
      request.form(JsonUtils.getObjectMap((JSONObject) this.data));
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
