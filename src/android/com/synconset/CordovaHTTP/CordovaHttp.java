/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset;

import org.apache.cordova.CallbackContext;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.util.Map;

import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.HostnameVerifier;

import java.util.Iterator;

import android.util.Log;
 
public abstract class CordovaHttp {
    protected static final String TAG = "CordovaHTTP";
    protected static final String CHARSET = "UTF-8";
    
    private static boolean sslPinning;
    private static boolean acceptAllCerts;
    
    private String urlString;
    private Map<?, ?> params;
    private Map<String, String> headers;
    private CallbackContext callbackContext;
    
    public CordovaHttp(String urlString, Map<?, ?> params, Map<String, String> headers, CallbackContext callbackContext) {
        this.urlString = urlString;
        this.params = params;
        this.headers = headers;
        this.sslPinning = sslPinning;
        this.acceptAllCerts = acceptAllCerts;
        this.callbackContext = callbackContext;
    }
    
    public static void enableSSLPinning(boolean enable) {
        sslPinning = enable;
        if (sslPinning) {
            acceptAllCerts = false;
        }
    }
    
    public static void acceptAllCerts(boolean accept) {
        acceptAllCerts = accept;
        if (acceptAllCerts) {
            sslPinning = false;
        }
    }
    
    protected String getUrlString() {
        return this.urlString;
    }
    
    protected void setUrlString(String urlString) {
        this.urlString = urlString;
    }
    
    protected Map<?, ?> getParams() {
        return this.params;
    }
    
    protected void setParams(Map<?, ?> params) {
        this.params = params;
    }
    
    protected Map<String, String> getHeaders() {
        return this.headers;
    }
    
    protected void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }
    
    protected CallbackContext getCallbackContext() {
        return this.callbackContext;
    }
    
    protected boolean sslPinning() {
        return sslPinning;
    }
    
    protected boolean acceptAllCerts() {
        return acceptAllCerts;
    }
    
    protected void respondWithError(String msg) {
        try {
            JSONObject response = new JSONObject();
            response.put("status", 500);
            response.put("error", msg);
            this.callbackContext.error(response);
        } catch (JSONException e) {
            this.callbackContext.error(msg);
        }
    }
}
