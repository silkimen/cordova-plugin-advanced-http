/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset.cordovahttp;

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

import android.content.res.AssetManager;

import com.silkimen.http.HttpRequest;
import com.silkimen.cordovahttp.CordovaHttpRequest;

public class CordovaHttpPlugin extends CordovaPlugin {
    private static final String TAG = "CordovaHTTP";

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);

        try {
          //HttpRequest.clearCerts();
          this.pinSSLCertsFromCAStore();
        } catch (Exception e) {
          e.printStackTrace();
          System.err.println("There was an error loading system's CA certificates");
        }
    }

    @Override
    public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("post")) {
            String url = args.getString(0);
            Object data = args.get(1);
            String serializer = args.getString(2);
            JSONObject headers = args.getJSONObject(3);
            int timeout = args.getInt(4) * 1000;

            CordovaHttpRequest post = new CordovaHttpRequest("POST", url, serializer, data, headers, timeout, callbackContext);

            cordova.getThreadPool().execute(post);
        } else if (action.equals("get")) {
            String url = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            int timeout = args.getInt(3) * 1000;

            CordovaHttpRequest get = new CordovaHttpRequest("GET", url, params, headers, timeout, callbackContext);

            cordova.getThreadPool().execute(get);
        } else if (action.equals("put")) {
            String url = args.getString(0);
            Object data = args.get(1);
            String serializer = args.getString(2);
            JSONObject headers = args.getJSONObject(3);
            int timeout = args.getInt(4) * 1000;

            CordovaHttpRequest put = new CordovaHttpRequest("PUT", url, serializer, data, headers, timeout, callbackContext);

            cordova.getThreadPool().execute(put);
        } else if (action.equals("patch")) {
            String url = args.getString(0);
            Object data = args.get(1);
            String serializer = args.getString(2);
            JSONObject headers = args.getJSONObject(3);
            int timeout = args.getInt(4) * 1000;

            CordovaHttpRequest patch = new CordovaHttpRequest("PATCH", url, serializer, data, headers, timeout, callbackContext);

            cordova.getThreadPool().execute(patch);
        }
         else if (action.equals("delete")) {
            String url = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            int timeout = args.getInt(3) * 1000;

            CordovaHttpRequest delete = new CordovaHttpRequest("DELETE", url, params, headers, timeout, callbackContext);

            cordova.getThreadPool().execute(delete);
        } else if (action.equals("head")) {
            String url = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            int timeout = args.getInt(3) * 1000;

            CordovaHttpRequest head = new CordovaHttpRequest("HEAD", url, params, headers, timeout, callbackContext);

            cordova.getThreadPool().execute(head);
        } else if (action.equals("setSSLCertMode")) {
            String mode = args.getString(0);

            //HttpRequest.clearCerts();

            if (mode.equals("legacy")) {
                //HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_DEFAULT);
                callbackContext.success();
            } else if (mode.equals("nocheck")) {
                //HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_TRUSTALL);
                callbackContext.success();
            } else if (mode.equals("pinned")) {
                try {
                    this.loadSSLCertsFromBundle();
                    //HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_PINNED);
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
        } else if (action.equals("uploadFile")) {
            String url = args.getString(0);
            Object params = args.get(1);
            JSONObject headers = args.getJSONObject(2);
            String filePath = args.getString(3);
            String name = args.getString(4);
            int timeout = args.getInt(5) * 1000;

            CordovaHttpUpload upload = new CordovaHttpUpload(url, params, headers, filePath, name, timeout, callbackContext);

            cordova.getThreadPool().execute(upload);
        } else if (action.equals("downloadFile")) {
            String url = args.getString(0);
            Object params = args.get(1);
            JSONObject headers = args.getJSONObject(2);
            String filePath = args.getString(3);
            int timeout = args.getInt(4) * 1000;

            CordovaHttpDownload download = new CordovaHttpDownload(url, params, headers, filePath, timeout, callbackContext);

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

    private void pinSSLCertsFromCAStore() throws GeneralSecurityException, IOException {
      this.loadSSLCertsFromKeyStore("AndroidCAStore");
      //HttpRequest.setSSLCertMode(HttpRequest.CERT_MODE_PINNED);
    }

    private void loadSSLCertsFromKeyStore(String storeType) throws GeneralSecurityException, IOException {
      KeyStore ks = KeyStore.getInstance(storeType);
      ks.load(null);
      Enumeration<String> aliases = ks.aliases();

      while (aliases.hasMoreElements()) {
        String alias = aliases.nextElement();
        TrustedCertificateEntry certEntry = (TrustedCertificateEntry) ks.getEntry(alias, null);
        Certificate cert = certEntry.getTrustedCertificate();
        //HttpRequest.addCert(cert);
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
            //HttpRequest.addCert(caInput);
        }
    }
}
