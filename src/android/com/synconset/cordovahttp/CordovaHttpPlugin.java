/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset.cordovahttp;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import java.security.GeneralSecurityException;

import java.util.ArrayList;
import java.util.List;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.AssetManager;
import android.util.Base64;

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
        } else if (action.equals("enableSSLPinning")) {
            try {
                boolean enable = args.getBoolean(0);
                this.enableSSLPinning(enable);
                callbackContext.success();
            } catch(Exception e) {
                e.printStackTrace();
                callbackContext.error("There was an error setting up ssl pinning");
            }
        } else if (action.equals("addPinningCerts")) {
            try {
                List<String> certs = this.getStringListFromJSONArray(args.getJSONArray(0));
                this.addPinningCerts(certs);
                callbackContext.success();
            } catch(Exception e) {
                e.printStackTrace();
                callbackContext.error("There was an error adding pinning certs");
            }
        } else if (action.equals("acceptAllCerts")) {
            boolean accept = args.getBoolean(0);

            CordovaHttp.acceptAllCerts(accept);
            CordovaHttp.validateDomainName(!accept);
            callbackContext.success();
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

    private void enableSSLPinning(boolean enable) throws GeneralSecurityException, IOException {
        if (enable) {
            AssetManager assetManager = cordova.getActivity().getAssets();
            String[] files = assetManager.list("");
            int index;
            ArrayList<String> cerFiles = new ArrayList<>();
            for (String file : files) {
                index = file.lastIndexOf('.');
                if (index != -1) {
                    if (file.substring(index).equals(".cer")) {
                        cerFiles.add(file);
                    }
                }
            }

            // scan the www/certificates folder for .cer files as well
            files = assetManager.list("www/certificates");
            for (String file : files) {
                index = file.lastIndexOf('.');
                if (index != -1) {
                    if (file.substring(index).equals(".cer")) {
                        cerFiles.add("www/certificates/" + file);
                    }
                }
            }

            for (int i = 0; i < cerFiles.size(); i++) {
                InputStream in = cordova.getActivity().getAssets().open(cerFiles.get(i));
                InputStream caInput = new BufferedInputStream(in);
                HttpRequest.addCert(caInput);
            }
            CordovaHttp.enableSSLPinning(true);
        } else {
            CordovaHttp.enableSSLPinning(false);
        }
    }

    private void addPinningCerts(List<String> certs) throws GeneralSecurityException, IOException {
      for (int i = 0; i < certs.size(); i++) {
        byte[] certBytes = Base64.decode(certs.get(i), Base64.NO_WRAP);
        InputStream inputStream = new ByteArrayInputStream(certBytes);
        HttpRequest.addCert(inputStream);
      }
    }

    private List<String> getStringListFromJSONArray(JSONArray array) throws JSONException {
        List<String> list = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            list.add(array.getString(i));
        }
        return list;
    }
}
