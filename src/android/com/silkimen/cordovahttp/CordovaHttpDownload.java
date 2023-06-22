package com.silkimen.cordovahttp;

import android.util.Log;

import java.io.File;
import java.net.URI;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLSocketFactory;

import com.silkimen.http.HttpRequest;
import com.silkimen.http.TLSConfiguration;

import org.apache.cordova.PluginResult;
import org.apache.cordova.file.FileUtils;
import org.json.JSONException;
import org.json.JSONObject;

class CordovaHttpDownload extends CordovaHttpBase {
  private String filePath;

  private boolean hasProgressCallback;

  public CordovaHttpDownload(String url, JSONObject headers, String filePath, int connectTimeout, int readTimeout,
      boolean followRedirects, boolean hasProgressCallback, TLSConfiguration tlsConfiguration, CordovaObservableCallbackContext callbackContext) {

    super("GET", url, headers, connectTimeout, readTimeout, followRedirects, "text", tlsConfiguration, callbackContext);
    this.filePath = filePath;
    this.hasProgressCallback = hasProgressCallback;
  }

  @Override
  protected HttpRequest createRequest() throws JSONException {
    return new HttpRequest(this.url, this.method, this.hasProgressCallback);
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

    request.progress(null);
  }

  @Override
  protected void sendBody(HttpRequest request) throws Exception {
    if (hasProgressCallback) {
      int fileLength = request.getConnection().getContentLength();
      request.progress(new HttpRequest.UploadProgress() {
        public void onUpload(long transferred, long total) {
          JSONObject json = new JSONObject();
          try {
            json.put("isProgress", true);
            json.put("transferred", transferred);
            json.put("total", fileLength);

            PluginResult result = new PluginResult(PluginResult.Status.OK, json);
            result.setKeepCallback(true);
            callbackContext.getCallbackContext().sendPluginResult(result);
          } catch (JSONException e) {
            Log.e(TAG, "onUpload progress error", e);
          }
        }
      });
    }
  }
}
