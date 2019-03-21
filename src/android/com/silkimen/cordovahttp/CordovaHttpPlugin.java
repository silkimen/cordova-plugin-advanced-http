package com.silkimen.cordovahttp;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;

import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.KeyStore.TrustedCertificateEntry;
import java.security.cert.Certificate;

import java.util.ArrayList;
import java.util.Enumeration;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;
import android.content.res.AssetManager;

public class CordovaHttpPlugin extends CordovaPlugin {
  private static final String TAG = "Cordova-Plugin-HTTP";

  private static boolean followRedirects = true;

  @Override
  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);

    try {
      // HttpRequest.clearCerts();
      this.pinSSLCertsFromCAStore();
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
      return this.executeHttpRequestWithParams(action, args, callbackContext);
    case "post":
      return this.executeHttpRequestWithData(action, args, callbackContext);
    case "put":
      return this.executeHttpRequestWithData(action, args, callbackContext);
    case "patch":
      return this.executeHttpRequestWithData(action, args, callbackContext);
    case "head":
      return this.executeHttpRequestWithParams(action, args, callbackContext);
    case "delete":
      return this.executeHttpRequestWithParams(action, args, callbackContext);
    case "uploadFile":
      return this.uploadFile(args, callbackContext);
    case "downloadFile":
      return this.downloadFile(args, callbackContext);
    case "setSSLCertMode":
      return this.setSSLCertMode(args, callbackContext);
    case "disableRedirect":
      return this.disableRedirect(args, callbackContext);
    default:
      return false;
    }
  }

  private boolean executeHttpRequestWithParams(final String method, final JSONArray args,
      final CallbackContext callbackContext) throws JSONException {

    String url = args.getString(0);
    JSONObject params = args.getJSONObject(1);
    JSONObject headers = args.getJSONObject(2);
    int timeout = args.getInt(3) * 1000;

    CordovaHttpRequest get = new CordovaHttpRequest(method.toUpperCase(), url, params, headers, timeout,
        callbackContext);

    cordova.getThreadPool().execute(get);

    return true;
  }

  private boolean executeHttpRequestWithData(final String method, final JSONArray args,
      final CallbackContext callbackContext) throws JSONException {

    String url = args.getString(0);
    Object data = args.get(1);
    String serializer = args.getString(2);
    JSONObject headers = args.getJSONObject(3);
    int timeout = args.getInt(4) * 1000;

    CordovaHttpRequest request = new CordovaHttpRequest(method.toUpperCase(), url, serializer, data, headers, timeout,
        callbackContext);

    cordova.getThreadPool().execute(request);

    return true;
  }

  private boolean uploadFile(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    String url = args.getString(0);
    JSONObject params = args.getJSONObject(1);
    JSONObject headers = args.getJSONObject(2);
    String filePath = args.getString(3);
    String uploadName = args.getString(4);
    int timeout = args.getInt(5) * 1000;

    CordovaHttpUpload upload = new CordovaHttpUpload(url, params, headers,
    filePath, uploadName, timeout, callbackContext);

    cordova.getThreadPool().execute(upload);

    return true;
  }

  private boolean downloadFile(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    String url = args.getString(0);
    JSONObject params = args.getJSONObject(1);
    JSONObject headers = args.getJSONObject(2);
    String filePath = args.getString(3);
    int timeout = args.getInt(4) * 1000;

    CordovaHttpDownload download = new CordovaHttpDownload(url, params, headers, filePath, timeout, callbackContext);

    cordova.getThreadPool().execute(download);

    return true;
  }

  private boolean setSSLCertMode(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    String mode = args.getString(0);

    // HttpRequest.clearCerts();

    if (mode.equals("legacy")) {
      // HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_DEFAULT);
      callbackContext.success();
    } else if (mode.equals("nocheck")) {
      // HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_TRUSTALL);
      callbackContext.success();
    } else if (mode.equals("pinned")) {
      try {
        this.loadSSLCertsFromBundle();
        // HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_PINNED);
        callbackContext.success();
      } catch (Exception e) {
        e.printStackTrace();
        callbackContext.error("There was an error setting up ssl pinning");
      }
    } else if (mode.equals("default")) {
      try {
        this.pinSSLCertsFromCAStore();
        callbackContext.success();
      } catch (Exception e) {
        e.printStackTrace();
        callbackContext.error("There was an error loading system's CA certificates");
      }
    }

    return true;
  }

  private boolean disableRedirect(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    followRedirects = !args.getBoolean(0);

    callbackContext.success();

    return true;
  }

  private void pinSSLCertsFromCAStore() throws GeneralSecurityException, IOException {
    this.loadSSLCertsFromKeyStore("AndroidCAStore");
    // HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_PINNED);
  }

  private void loadSSLCertsFromKeyStore(String storeType) throws GeneralSecurityException, IOException {
    KeyStore ks = KeyStore.getInstance(storeType);
    ks.load(null);
    Enumeration<String> aliases = ks.aliases();

    while (aliases.hasMoreElements()) {
      String alias = aliases.nextElement();
      TrustedCertificateEntry certEntry = (TrustedCertificateEntry) ks.getEntry(alias, null);
      Certificate cert = certEntry.getTrustedCertificate();
      // HttpRequest.addCert(cert);
    }
  }

  private void loadSSLCertsFromBundle() throws GeneralSecurityException, IOException {
    AssetManager assetManager = cordova.getActivity().getAssets();
    String[] files = assetManager.list("www/certificates");
    ArrayList<String> cerFiles = new ArrayList<String>();

    for (int i = 0; i < files.length; i++) {
      int index = files[i].lastIndexOf('.');
      if (index != -1) {
        if (files[i].substring(index).equals(".cer")) {
          cerFiles.add("www/certificates/" + files[i]);
        }
      }
    }

    for (int i = 0; i < cerFiles.size(); i++) {
      InputStream in = cordova.getActivity().getAssets().open(cerFiles.get(i));
      InputStream caInput = new BufferedInputStream(in);
      // HttpRequest.addCert(caInput);
    }
  }
}
