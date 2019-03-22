package com.silkimen.cordovahttp;

import java.io.File;
import java.net.URI;

import javax.net.ssl.SSLSocketFactory;

import com.silkimen.http.HttpRequest;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.file.FileUtils;
import org.json.JSONObject;

class CordovaHttpDownload extends CordovaHttpBase {
  private String filePath;

  public CordovaHttpDownload(String url, JSONObject params, JSONObject headers, String filePath, int timeout,
      boolean followRedirects, SSLSocketFactory customSSLSocketFactory, CallbackContext callbackContext) {

    super("GET", url, params, headers, timeout, followRedirects, customSSLSocketFactory, callbackContext);
    this.filePath = filePath;
  }

  @Override
  protected void processResponse(HttpRequest request, CordovaHttpResponse response) throws Exception {
    response.setStatus(request.code());
    response.setUrl(request.url().toString());
    response.setHeaders(request.headers());

    if (request.code() >= 200 && request.code() < 300) {
      File file = new File(new URI(this.filePath));
      JSONObject fileEntry = FileUtils.getFilePlugin().getEntryForFile(file);

      request.receive(file);
      response.setFileEntry(fileEntry);
    } else {
      response.setErrorMessage("There was an error downloading the file");
    }
  }
}
