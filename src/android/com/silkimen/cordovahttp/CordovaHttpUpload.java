package com.silkimen.cordovahttp;

import android.webkit.MimeTypeMap;

import com.silkimen.http.HttpRequest;

import java.io.File;
import java.net.URI;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLSocketFactory;

import com.silkimen.http.TLSConfiguration;

import org.apache.cordova.CallbackContext;
import org.json.JSONObject;

class CordovaHttpUpload extends CordovaHttpBase {
  private String filePath;
  private String uploadName;

  public CordovaHttpUpload(String url, JSONObject headers, String filePath, String uploadName, int timeout,
      boolean followRedirects, String responseType, TLSConfiguration tlsConfiguration,
      CallbackContext callbackContext) {

    super("POST", url, headers, timeout, followRedirects, responseType, tlsConfiguration, callbackContext);
    this.filePath = filePath;
    this.uploadName = uploadName;
  }

  @Override
  protected void sendBody(HttpRequest request) throws Exception {
    int filenameIndex = this.filePath.lastIndexOf('/');
    String filename = this.filePath.substring(filenameIndex + 1);

    int extIndex = this.filePath.lastIndexOf('.');
    String ext = this.filePath.substring(extIndex + 1);

    MimeTypeMap mimeTypeMap = MimeTypeMap.getSingleton();
    String mimeType = mimeTypeMap.getMimeTypeFromExtension(ext);

    request.part(this.uploadName, filename, mimeType, new File(new URI(this.filePath)));
  }
}
