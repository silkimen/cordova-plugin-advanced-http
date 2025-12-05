package com.silkimen.cordovahttp;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Log;
import android.webkit.MimeTypeMap;

import com.silkimen.http.HttpRequest;
import com.silkimen.http.TLSConfiguration;

import java.io.File;
import java.io.InputStream;
import java.net.URI;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLSocketFactory;

import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

class CordovaHttpUpload extends CordovaHttpBase {
  private JSONArray filePaths;
  private JSONArray uploadNames;
  private Context applicationContext;
  private boolean hasProgressCallback;

  public CordovaHttpUpload(String url, JSONObject headers, JSONArray filePaths, JSONArray uploadNames, int connectTimeout, int readTimeout,
      boolean followRedirects, boolean hasProgressCallback, String responseType, TLSConfiguration tlsConfiguration,
      Context applicationContext, CordovaObservableCallbackContext callbackContext) {

    super("POST", url, headers, connectTimeout, readTimeout, followRedirects, responseType, tlsConfiguration, callbackContext);
    this.filePaths = filePaths;
    this.uploadNames = uploadNames;
    this.applicationContext = applicationContext;
    this.hasProgressCallback = hasProgressCallback;
  }
  
  @Override
  protected HttpRequest createRequest() throws JSONException {
    return new HttpRequest(this.url, this.method, this.hasProgressCallback);
  }

  @Override
  protected void sendBody(HttpRequest request) throws Exception {
    for (int i = 0; i < this.filePaths.length(); ++i) {
      String uploadName = this.uploadNames.getString(i);
      String filePath = this.filePaths.getString(i);

      Uri fileUri = Uri.parse(filePath);

      // File Scheme
      if (ContentResolver.SCHEME_FILE.equals(fileUri.getScheme())) {
        File file = new File(new URI(filePath));
        String fileName = file.getName().trim();
        String mimeType = this.getMimeTypeFromFileName(fileName);

        request.part(uploadName, fileName, mimeType, file);
      }

      // Content Scheme
      if (ContentResolver.SCHEME_CONTENT.equals(fileUri.getScheme())) {
        InputStream inputStream = this.applicationContext.getContentResolver().openInputStream(fileUri);
        String fileName = this.getFileNameFromContentScheme(fileUri, this.applicationContext).trim();
        String mimeType = this.getMimeTypeFromFileName(fileName);

        request.part(uploadName, fileName, mimeType, inputStream);
      }

      if (hasProgressCallback) {
        request.progress(new HttpRequest.UploadProgress() {
          public void onUpload(long transferred, long total) {
            JSONObject json = new JSONObject();
            try {
              json.put("isProgress", true);
              json.put("transferred", transferred);
              json.put("total", total);

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

  private String getFileNameFromContentScheme(Uri contentSchemeUri, Context applicationContext) {
    Cursor returnCursor = applicationContext.getContentResolver().query(contentSchemeUri, null, null, null, null);

    if (returnCursor == null || !returnCursor.moveToFirst()) {
      return null;
    }

    int nameIndex = returnCursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
    String fileName = returnCursor.getString(nameIndex);
    returnCursor.close();

    return fileName;
  }

  private String getMimeTypeFromFileName(String fileName) {
    if (fileName == null || !fileName.contains(".")) {
      return null;
    }

    MimeTypeMap mimeTypeMap = MimeTypeMap.getSingleton();
    int extIndex = fileName.lastIndexOf('.') + 1;
    String extension = fileName.substring(extIndex).toLowerCase();

    return mimeTypeMap.getMimeTypeFromExtension(extension);
  }
}
