package com.silkimen.cordovahttp;

import java.io.File;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.net.URI;
import java.net.URISyntaxException;

import javax.net.ssl.SSLHandshakeException;

import com.silkimen.http.HttpBodyDecoder;
import com.silkimen.http.HttpRequest;
import com.silkimen.http.HttpRequest.HttpRequestException;
import com.silkimen.http.JsonUtils;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.file.FileUtils;

import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

class CordovaHttpDownload implements Runnable {
  private static final String TAG = "Cordova-Plugin-HTTP";

  private String url;
  private JSONObject params;
  private JSONObject headers;
  private String filePath;
  private int timeout;
  private CallbackContext callbackContext;

  public CordovaHttpDownload(String url, JSONObject params, JSONObject headers, String filePath, int timeout,
      CallbackContext callbackContext) {

    this.url = url;
    this.params = params;
    this.headers = headers;
    this.filePath = filePath;
    this.timeout = timeout;
    this.callbackContext = callbackContext;
  }

  @Override
  public void run() {
    CordovaHttpResponse response = new CordovaHttpResponse();

    try {
      String processedUrl = HttpRequest.encode(HttpRequest.append(this.url, JsonUtils.getObjectMap(this.params)));

      HttpRequest request = new HttpRequest(processedUrl, "GET")
          .followRedirects(true /* @TODO */)
          .readTimeout(this.timeout)
          .acceptCharset("UTF-8")
          .uncompress(true)
          .headers(JsonUtils.getStringMap(this.headers));

      response.setStatus(request.code());
      response.setUrl(request.url().toString());
      response.setHeaders(request.headers());

      if (request.code() >= 200 && request.code() < 300) {
        File file = new File(new URI(filePath));

        request.receive(file);
        response.setFileEntry(FileUtils.getFilePlugin().getEntryForFile(file));
      } else {
        response.setErrorMessage("There was an error downloading the file");
      }
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
      Log.e(TAG, "An unexpected error occured while processing HTTP response", e);
    }
  }
}
