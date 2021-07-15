package com.silkimen.cordovahttp;

import java.security.KeyStore;
import java.util.HashMap;
import java.util.Observable;
import java.util.Observer;
import java.util.concurrent.Future;

import com.silkimen.http.TLSConfiguration;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;
import android.util.Base64;

import javax.net.ssl.TrustManagerFactory;

public class CordovaHttpPlugin extends CordovaPlugin implements Observer {
  private static final String TAG = "Cordova-Plugin-HTTP";

  private TLSConfiguration tlsConfiguration;

  private HashMap<Integer, Future<?>> reqMap;
  private final Object reqMapLock = new Object();

  @Override
  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);

    this.tlsConfiguration = new TLSConfiguration();

    this.reqMap = new HashMap<Integer, Future<?>>();

    try {
      KeyStore store = KeyStore.getInstance("AndroidCAStore");
      String tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
      TrustManagerFactory tmf = TrustManagerFactory.getInstance(tmfAlgorithm);

      store.load(null);
      tmf.init(store);

      this.tlsConfiguration.setHostnameVerifier(null);
      this.tlsConfiguration.setTrustManagers(tmf.getTrustManagers());

      if (this.preferences.contains("androidblacklistsecuresocketprotocols")) {
        this.tlsConfiguration.setBlacklistedProtocols(
          this.preferences.getString("androidblacklistsecuresocketprotocols", "").split(",")
        );
      }

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

    if ("get".equals(action)) {
      return this.executeHttpRequestWithoutData(action, args, callbackContext);
    } else if ("head".equals(action)) {
      return this.executeHttpRequestWithoutData(action, args, callbackContext);
    } else if ("delete".equals(action)) {
      return this.executeHttpRequestWithoutData(action, args, callbackContext);
    } else if ("options".equals(action)) {
      return this.executeHttpRequestWithoutData(action, args, callbackContext);
    } else if ("post".equals(action)) {
      return this.executeHttpRequestWithData(action, args, callbackContext);
    } else if ("put".equals(action)) {
      return this.executeHttpRequestWithData(action, args, callbackContext);
    } else if ("patch".equals(action)) {
      return this.executeHttpRequestWithData(action, args, callbackContext);
    } else if ("uploadFiles".equals(action)) {
      return this.uploadFiles(args, callbackContext);
    } else if ("downloadFile".equals(action)) {
      return this.downloadFile(args, callbackContext);
    } else if ("setServerTrustMode".equals(action)) {
      return this.setServerTrustMode(args, callbackContext);
    } else if ("setClientAuthMode".equals(action)) {
      return this.setClientAuthMode(args, callbackContext);
    } else if ("abort".equals(action)) {
      return this.abort(args, callbackContext);
    } else {
      return false;
    }
  }

  private boolean executeHttpRequestWithoutData(final String method, final JSONArray args,
      final CallbackContext callbackContext) throws JSONException {

    String url = args.getString(0);
    JSONObject headers = args.getJSONObject(1);
    int timeout = args.getInt(2) * 1000;
    boolean followRedirect = args.getBoolean(3);
    String responseType = args.getString(4);

    Integer reqId = args.getInt(5);
    CordovaObservableCallbackContext observableCallbackContext = new CordovaObservableCallbackContext(callbackContext, reqId);

    CordovaHttpOperation request = new CordovaHttpOperation(method.toUpperCase(), url, headers, timeout, followRedirect,
        responseType, this.tlsConfiguration, observableCallbackContext);

    startRequest(reqId, observableCallbackContext, request);

    return true;
  }

  private boolean executeHttpRequestWithData(final String method, final JSONArray args,
      final CallbackContext callbackContext) throws JSONException {

    String url = args.getString(0);
    Object data = args.get(1);
    String serializer = args.getString(2);
    JSONObject headers = args.getJSONObject(3);
    int timeout = args.getInt(4) * 1000;
    boolean followRedirect = args.getBoolean(5);
    String responseType = args.getString(6);

    Integer reqId = args.getInt(7);
    CordovaObservableCallbackContext observableCallbackContext = new CordovaObservableCallbackContext(callbackContext, reqId);

    CordovaHttpOperation request = new CordovaHttpOperation(method.toUpperCase(), url, serializer, data, headers,
        timeout, followRedirect, responseType, this.tlsConfiguration, observableCallbackContext);

    startRequest(reqId, observableCallbackContext, request);

    return true;
  }

  private boolean uploadFiles(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    String url = args.getString(0);
    JSONObject headers = args.getJSONObject(1);
    JSONArray filePaths = args.getJSONArray(2);
    JSONArray uploadNames = args.getJSONArray(3);
    int timeout = args.getInt(4) * 1000;
    boolean followRedirect = args.getBoolean(5);
    String responseType = args.getString(6);

    Integer reqId = args.getInt(7);
    CordovaObservableCallbackContext observableCallbackContext = new CordovaObservableCallbackContext(callbackContext, reqId);

    CordovaHttpUpload upload = new CordovaHttpUpload(url, headers, filePaths, uploadNames, timeout, followRedirect,
        responseType, this.tlsConfiguration, this.cordova.getActivity().getApplicationContext(), observableCallbackContext);

    startRequest(reqId, observableCallbackContext, upload);

    return true;
  }

  private boolean downloadFile(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    String url = args.getString(0);
    JSONObject headers = args.getJSONObject(1);
    String filePath = args.getString(2);
    int timeout = args.getInt(3) * 1000;
    boolean followRedirect = args.getBoolean(4);

    Integer reqId = args.getInt(5);
    CordovaObservableCallbackContext observableCallbackContext = new CordovaObservableCallbackContext(callbackContext, reqId);

    CordovaHttpDownload download = new CordovaHttpDownload(url, headers, filePath, timeout, followRedirect,
        this.tlsConfiguration, observableCallbackContext);

    startRequest(reqId, observableCallbackContext, download);

    return true;
  }

  private void startRequest(Integer reqId, CordovaObservableCallbackContext observableCallbackContext, CordovaHttpBase request) {
    synchronized (reqMapLock) {
      observableCallbackContext.setObserver(this);
      Future<?> task = cordova.getThreadPool().submit(request);
      this.addReq(reqId, task, observableCallbackContext);
    }
  }

  private boolean setServerTrustMode(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    CordovaServerTrust runnable = new CordovaServerTrust(args.getString(0), this.cordova.getActivity(),
        this.tlsConfiguration, callbackContext);

    cordova.getThreadPool().execute(runnable);

    return true;
  }

  private boolean setClientAuthMode(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    byte[] pkcs = args.isNull(2) ? null : Base64.decode(args.getString(2), Base64.DEFAULT);

    CordovaClientAuth runnable = new CordovaClientAuth(args.getString(0), args.isNull(1) ? null : args.getString(1),
        pkcs, args.getString(3), this.cordova.getActivity(), this.cordova.getActivity().getApplicationContext(),
        this.tlsConfiguration, callbackContext);

    cordova.getThreadPool().execute(runnable);

    return true;
  }

  private boolean abort(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    int reqId = args.getInt(0);
    boolean result = false;
    // NOTE no synchronized (reqMapLock), since even if the req was already removed from reqMap,
    //      the worst that would happen calling task.cancel(true) is a result of false
    //      (i.e. same result as locking & not finding the req in reqMap)
    Future<?> task = this.reqMap.get(reqId);

    if (task != null && !task.isDone()) {
      result = task.cancel(true);
    }

    callbackContext.success(new JSONObject().put("aborted", result));

    return true;
  }

  private void addReq(final Integer reqId, final Future<?> task, final CordovaObservableCallbackContext observableCallbackContext) {
    synchronized (reqMapLock) {
      if (!task.isDone()){
        this.reqMap.put(reqId, task);
      }
    }
  }

  private void removeReq(final Integer reqId) {
    synchronized (reqMapLock) {
      this.reqMap.remove(reqId);
    }
  }

  @Override
  public void update(Observable o, Object arg) {
    synchronized (reqMapLock) {
      CordovaObservableCallbackContext c = (CordovaObservableCallbackContext) arg;
      if (c.getCallbackContext().isFinished()) {
        removeReq(c.getRequestId());
      }
    }
  }
}
