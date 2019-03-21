package com.silkimen.cordovahttp;

import java.io.ByteArrayOutputStream;
import java.io.File;

import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;

import java.nio.ByteBuffer;

import javax.net.ssl.SSLHandshakeException;

import com.silkimen.http.HttpBodyDecoder;
import com.silkimen.http.HttpRequest;
import com.silkimen.http.HttpRequest.HttpRequestException;
import com.silkimen.http.JsonUtils;

import org.apache.cordova.CallbackContext;

import org.json.JSONException;
import org.json.JSONObject;

import android.webkit.MimeTypeMap;
import android.util.Log;

class CordovaHttpUpload implements Runnable {
  private static final String TAG = "Cordova-Plugin-HTTP";

  private String url;
  private JSONObject params;
  private JSONObject headers;
  private String filePath;
  private String uploadName;
  private int timeout;
  private CallbackContext callbackContext;

  public CordovaHttpUpload(String url, JSONObject params, JSONObject headers, String filePath, String uploadName,
      int timeout, CallbackContext callbackContext) {

    this.url = url;
    this.params = params;
    this.headers = headers;
    this.filePath = filePath;
    this.uploadName = uploadName;
    this.timeout = timeout;
    this.callbackContext = callbackContext;
  }

  @Override
  public void run() {
    CordovaHttpResponse response = new CordovaHttpResponse();

    try {
      String processedUrl = HttpRequest.encode(HttpRequest.append(this.url, JsonUtils.getObjectMap(this.params)));
      ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

      HttpRequest request = new HttpRequest(processedUrl, "POST")
        .followRedirects(true /* @TODO */)
        .readTimeout(this.timeout)
        .acceptCharset("UTF-8")
        .uncompress(true)
        .headers(JsonUtils.getStringMap(this.headers));

      int filenameIndex = filePath.lastIndexOf('/');
      String filename = filePath.substring(filenameIndex + 1);

      int extIndex = filePath.lastIndexOf('.');
      String ext = filePath.substring(extIndex + 1);

      MimeTypeMap mimeTypeMap = MimeTypeMap.getSingleton();
      String mimeType = mimeTypeMap.getMimeTypeFromExtension(ext);

      request.part(this.uploadName, filename, mimeType, new File(new URI(this.filePath)))
          .receive(outputStream);

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
    } catch (URISyntaxException e) {
      response.setStatus(-1);
      response.setErrorMessage("An error occured while loading file");
      Log.e(TAG, "An error occured while loading file", e);
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
