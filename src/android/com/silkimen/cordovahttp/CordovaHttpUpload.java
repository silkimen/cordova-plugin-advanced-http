package com.silkimen.cordovahttp;

import android.webkit.MimeTypeMap;

import com.silkimen.http.HttpRequest;

import java.io.File;
import java.net.URI;

import org.apache.cordova.CallbackContext;
import org.json.JSONObject;


class CordovaHttpUpload extends CordovaHttpBase {
  private String filePath;
  private String uploadName;

  public CordovaHttpUpload(String url, JSONObject params, JSONObject headers, String filePath, String uploadName,
      int timeout, CallbackContext callbackContext) {

    super("POST", url, params, headers, timeout, callbackContext);
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
