/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset.cordovahttp;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;

import java.security.GeneralSecurityException;
import java.security.KeyStore;
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

import android.content.res.AssetManager;

import com.github.kevinsawicki.http.HttpRequest;

public class CordovaHttpPlugin extends CordovaPlugin {
    private static final String TAG = "CordovaHTTP";

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
    }

    @Override
    public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("post")) {
            String urlString = args.getString(0);
            Object params = args.get(1);
            String serializerName = args.getString(2);
            JSONObject headers = args.getJSONObject(3);
            int timeoutInMilliseconds = args.getInt(4) * 1000;
            CordovaHttpPost post = new CordovaHttpPost(urlString, params, serializerName, headers, timeoutInMilliseconds, callbackContext);

            cordova.getThreadPool().execute(post);
        } else if (action.equals("get")) {
            String urlString = args.getString(0);
            Object params = args.get(1);
            JSONObject headers = args.getJSONObject(2);
            int timeoutInMilliseconds = args.getInt(3) * 1000;
            CordovaHttpGet get = new CordovaHttpGet(urlString, params, headers, timeoutInMilliseconds, callbackContext);

            cordova.getThreadPool().execute(get);
        } else if (action.equals("put")) {
            String urlString = args.getString(0);
            Object params = args.get(1);
            String serializerName = args.getString(2);
            JSONObject headers = args.getJSONObject(3);
            int timeoutInMilliseconds = args.getInt(4) * 1000;
            CordovaHttpPut put = new CordovaHttpPut(urlString, params, serializerName, headers, timeoutInMilliseconds, callbackContext);

            cordova.getThreadPool().execute(put);
        } else if (action.equals("patch")) {
            String urlString = args.getString(0);
            Object params = args.get(1);
            String serializerName = args.getString(2);
            JSONObject headers = args.getJSONObject(3);
            int timeoutInMilliseconds = args.getInt(4) * 1000;
            CordovaHttpPatch patch = new CordovaHttpPatch(urlString, params, serializerName, headers, timeoutInMilliseconds, callbackContext);

            cordova.getThreadPool().execute(patch);
        }
         else if (action.equals("delete")) {
            String urlString = args.getString(0);
            Object params = args.get(1);
            JSONObject headers = args.getJSONObject(2);
            int timeoutInMilliseconds = args.getInt(3) * 1000;
            CordovaHttpDelete delete = new CordovaHttpDelete(urlString, params, headers, timeoutInMilliseconds, callbackContext);

            cordova.getThreadPool().execute(delete);
        } else if (action.equals("head")) {
            String urlString = args.getString(0);
            Object params = args.get(1);
            JSONObject headers = args.getJSONObject(2);
            int timeoutInMilliseconds = args.getInt(3) * 1000;
            CordovaHttpHead head = new CordovaHttpHead(urlString, params, headers, timeoutInMilliseconds, callbackContext);

            cordova.getThreadPool().execute(head);
        } else if (action.equals("options")) {
            String urlString = args.getString(0);
            Object params = args.get(1);
            JSONObject headers = args.getJSONObject(2);
            int timeoutInMilliseconds = args.getInt(3) * 1000;
            CordovaHttpOptions options = new CordovaHttpOptions(urlString, params, headers, timeoutInMilliseconds, callbackContext);

            cordova.getThreadPool().execute(options);
        } else if (action.equals("setSSLCertMode")) {
            String mode = args.getString(0);

            if (mode.equals("legacy")) {
                HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_DEFAULT);
                callbackContext.success();
            } else if (mode.equals("nocheck")) {
                HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_TRUSTALL);
                callbackContext.success();
            } else if (mode.equals("pinned")) {
                try {
                    this.loadSSLCerts();
                    HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_PINNED);
                    callbackContext.success();
                } catch (Exception e) {
                    e.printStackTrace();
                    callbackContext.error("There was an error setting up ssl pinning");
                }
            } else if (mode.equals("default")) {
                try {
                    this.loadUserStoreSSLCerts();
                    HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_PINNED);
                    callbackContext.success();
                } catch (Exception e) {
                    e.printStackTrace();
                    callbackContext.error("There was an error loading system's CA certificates");
                }
            }
        } else if (action.equals("uploadFile")) {
            String urlString = args.getString(0);
            Object params = args.get(1);
            JSONObject headers = args.getJSONObject(2);
            String filePath = args.getString(3);
            String name = args.getString(4);
            int timeoutInMilliseconds = args.getInt(5) * 1000;
            CordovaHttpUpload upload = new CordovaHttpUpload(urlString, params, headers, filePath, name, timeoutInMilliseconds, callbackContext);

            cordova.getThreadPool().execute(upload);
        } else if (action.equals("downloadFile")) {
            String urlString = args.getString(0);
            Object params = args.get(1);
            JSONObject headers = args.getJSONObject(2);
            String filePath = args.getString(3);
            int timeoutInMilliseconds = args.getInt(4) * 1000;
            CordovaHttpDownload download = new CordovaHttpDownload(urlString, params, headers, filePath, timeoutInMilliseconds, callbackContext);

            cordova.getThreadPool().execute(download);
        } else if (action.equals("disableRedirect")) {
            boolean disable = args.getBoolean(0);
            CordovaHttp.disableRedirect(disable);
            callbackContext.success();
        } else {
            return false;
        }
        return true;
    }

    private void loadUserStoreSSLCerts() throws Exception {
      KeyStore ks = KeyStore.getInstance("AndroidCAStore");
      ks.load(null);
      Enumeration<String> aliases = ks.aliases();

      while (aliases.hasMoreElements()) {
        String alias = aliases.nextElement();
      }
    }

    private void loadSSLCerts() throws GeneralSecurityException, IOException {
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
            HttpRequest.addCert(caInput);
        }
    }
}
