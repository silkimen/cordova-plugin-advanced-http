/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Iterator;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Base64;
 
public class CordovaHTTP extends CordovaPlugin {
    private static final String TAG = "CordovaHTTP";
    
    private SSLContext sslContext;
    private JSONObject globalHeaders;
    
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        this.globalHeaders = new JSONObject();
        this.sslContext = null;
    }

    @Override
    public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("get")) {
            String urlString = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            this.addToJSONObject(headers, this.globalHeaders);
            HTTPGet get = new HTTPGet(urlString, params, headers, this.sslContext, callbackContext);
            cordova.getThreadPool().execute(get);
        } else if (action.equals("post")) {
            String urlString = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            this.addToJSONObject(headers, this.globalHeaders);
            HTTPPost post = new HTTPPost(urlString, params, headers, this.sslContext, callbackContext);
            cordova.getThreadPool().execute(post);
        } else if (action.equals("setAuthorizationHeaderWithUsernameAndPassword")) {
            String username = args.getString(0);
            String password = args.getString(1);
            this.setAuthorizationHeaderWithUsernameAndPassword(username, password);
            callbackContext.success();
        } else if (action.equals("setSSLPinningMode")) {
            int mode = args.getInt(0);
            try {
                this.setSSLPinningMode(mode);
                callbackContext.success();
            } catch(Exception e) {
                callbackContext.error("There was an error setting up ssl pinning");
            }
        } else {
            return false;
        }
        return true;
    }

    private void setAuthorizationHeaderWithUsernameAndPassword(String username, String password) throws JSONException {
        String loginInfo = username + ":" + password;
        loginInfo = "Basic " + Base64.encodeToString(loginInfo.getBytes(), Base64.NO_WRAP);
        globalHeaders.put("Authorization", loginInfo);
    }
    
    private void setSSLPinningMode(int mode) throws CertificateException, IOException, KeyStoreException, NoSuchAlgorithmException, KeyManagementException {
        // Load CAs from an InputStream
        // (could be from a resource or ByteArrayInputStream or ...)
        CertificateFactory cf = CertificateFactory.getInstance("X.509");
        // From https://www.washington.edu/itconnect/security/ca/load-der.crt
        InputStream in = cordova.getActivity().getAssets().open("PCA-3G5.cer");
        InputStream caInput = new BufferedInputStream(in);
        Certificate ca;
        try {
            ca = cf.generateCertificate(caInput);
            System.out.println("ca=" + ((X509Certificate) ca).getSubjectDN());
        } finally {
            caInput.close();
        }
        
        // Create a KeyStore containing our trusted CAs
        String keyStoreType = KeyStore.getDefaultType();
        KeyStore keyStore = KeyStore.getInstance(keyStoreType);
        keyStore.load(null, null);
        keyStore.setCertificateEntry("ca", ca);
        
        // Create a TrustManager that trusts the CAs in our KeyStore
        String tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
        TrustManagerFactory tmf = TrustManagerFactory.getInstance(tmfAlgorithm);
        tmf.init(keyStore);
        
        // Create an SSLContext that uses our TrustManager
        sslContext = SSLContext.getInstance("TLS");
        sslContext.init(null, tmf.getTrustManagers(), null);
    }

    private void addToJSONObject(JSONObject object, JSONObject objectToAdd) throws JSONException {
        Iterator<?> i = objectToAdd.keys();
        
        while (i.hasNext()) {
            String key = (String)i.next();
            if (!object.has(key)) {
                object.put(key, objectToAdd.getString(key));
            }
        }
    }
}
