package com.silkimen.cordovahttp;

import java.security.KeyStore;

import com.silkimen.http.TLSConfiguration;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

import javax.net.ssl.TrustManagerFactory;

public class CordovaHttpPlugin extends CordovaPlugin {
  private static final String TAG = "Cordova-Plugin-HTTP";

  private boolean followRedirects = true;
  private TLSConfiguration tlsConfiguration;

  @Override
  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);

    this.tlsConfiguration = new TLSConfiguration();

    try {
      KeyStore store = KeyStore.getInstance("AndroidCAStore");
      String tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
      TrustManagerFactory tmf = TrustManagerFactory.getInstance(tmfAlgorithm);

      store.load(null);
      tmf.init(store);

      this.tlsConfiguration.setHostnameVerifier(null);
      this.tlsConfiguration.setTrustManagers(tmf.getTrustManagers());
    } catch (Exception e) {
      Log.e(TAG, "An error occured while loading system's CA certificates", e);
    }
  }

  @Override
  public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext)
      throws JSONException {

    if (action == null) {
      return false;
    }

    switch (action) {
    case "get":
      return this.executeHttpRequestWithoutData(action, args, callbackContext);
    case "post":
      return this.executeHttpRequestWithData(action, args, callbackContext);
    case "put":
      return this.executeHttpRequestWithData(action, args, callbackContext);
    case "patch":
      return this.executeHttpRequestWithData(action, args, callbackContext);
    case "head":
      return this.executeHttpRequestWithoutData(action, args, callbackContext);
    case "delete":
      return this.executeHttpRequestWithoutData(action, args, callbackContext);
    case "uploadFile":
      return this.uploadFile(args, callbackContext);
    case "downloadFile":
      return this.downloadFile(args, callbackContext);
    case "setServerTrustMode":
      return this.setServerTrustMode(args, callbackContext);
    case "setClientAuthMode":
      return this.setClientAuthMode(args, callbackContext);
    case "disableRedirect":
      return this.disableRedirect(args, callbackContext);
    default:
      return false;
    }
  }

  private boolean executeHttpRequestWithoutData(final String method, final JSONArray args,
      final CallbackContext callbackContext) throws JSONException {

    String url = args.getString(0);
    JSONObject headers = args.getJSONObject(1);
    int timeout = args.getInt(2) * 1000;

    CordovaHttpOperation request = new CordovaHttpOperation(method.toUpperCase(), url, headers, timeout,
        this.followRedirects, this.tlsConfiguration, callbackContext);

    cordova.getThreadPool().execute(request);

    return true;
  }

  private boolean executeHttpRequestWithData(final String method, final JSONArray args,
      final CallbackContext callbackContext) throws JSONException {

    String url = args.getString(0);
    Object data = args.get(1);
    String serializer = args.getString(2);
    JSONObject headers = args.getJSONObject(3);
    int timeout = args.getInt(4) * 1000;

    CordovaHttpOperation request = new CordovaHttpOperation(method.toUpperCase(), url, serializer, data, headers,
        timeout, this.followRedirects, this.tlsConfiguration, callbackContext);

    cordova.getThreadPool().execute(request);

    return true;
  }

  private boolean uploadFile(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    String url = args.getString(0);
    JSONObject headers = args.getJSONObject(1);
    String filePath = args.getString(2);
    String uploadName = args.getString(3);
    int timeout = args.getInt(4) * 1000;

    CordovaHttpUpload upload = new CordovaHttpUpload(url, headers, filePath, uploadName, timeout, this.followRedirects,
        this.tlsConfiguration, callbackContext);

    cordova.getThreadPool().execute(upload);

    return true;
  }

  private boolean downloadFile(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    String url = args.getString(0);
    JSONObject headers = args.getJSONObject(1);
    String filePath = args.getString(2);
    int timeout = args.getInt(3) * 1000;

    CordovaHttpDownload download = new CordovaHttpDownload(url, headers, filePath, timeout, this.followRedirects,
        this.tlsConfiguration, callbackContext);

    cordova.getThreadPool().execute(download);

    return true;
  }

  private boolean setServerTrustMode(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    CordovaServerTrust runnable = new CordovaServerTrust(args.getString(0), this.cordova.getActivity(),
        this.tlsConfiguration, callbackContext);

    cordova.getThreadPool().execute(runnable);

    return true;
  }

  private boolean setClientAuthMode(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    CordovaClientAuth runnable = new CordovaClientAuth(args.getString(0), args.getString(1), this.cordova.getActivity(),
        this.cordova.getContext(), this.tlsConfiguration, callbackContext);

    cordova.getThreadPool().execute(runnable);

    return true;
  }

  private boolean disableRedirect(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    this.followRedirects = !args.getBoolean(0);

    callbackContext.success();

    return true;
  }
}
