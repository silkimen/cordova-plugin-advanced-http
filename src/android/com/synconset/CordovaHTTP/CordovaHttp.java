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

import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.HostnameVerifier;

import java.util.Iterator;

import android.util.Log;
 
public class CordovaHttp {
    protected static final String TAG = "CordovaHTTP";
    
    protected String charset = "UTF-8";
    
    private String urlString;
    private JSONObject params;
    private JSONObject headers;
    private SSLContext sslContext;
    private HostnameVerifier hostnameVerifier;
    private CallbackContext callbackContext;
    
    public CordovaHttp(String urlString, JSONObject params, JSONObject headers, SSLContext sslContext, HostnameVerifier hostnameVerifier, CallbackContext callbackContext) {
        this.urlString = urlString;
        this.params = params;
        this.headers = headers;
        this.sslContext = sslContext;
        this.callbackContext = callbackContext;
        this.hostnameVerifier = hostnameVerifier;
    }
    
    protected String getUrlString() {
        return this.urlString;
    }
    
    protected void setUrlString(String urlString) {
        this.urlString = urlString;
    }
    
    protected JSONObject getParams() {
        return this.params;
    }
    
    protected void setParams(JSONObject params) {
        this.params = params;
    }
    
    protected JSONObject getHeaders() {
        return this.headers;
    }
    
    protected void setHeaders(JSONObject headers) {
        this.headers = headers;
    }
    
    protected CallbackContext getCallbackContext() {
        return this.callbackContext;
    }
    
    protected HttpsURLConnection openConnection(String urlString) throws MalformedURLException, IOException {
        URL url = new URL(urlString);
        HttpsURLConnection conn = (HttpsURLConnection)url.openConnection();
        if (this.hostnameVerifier != null) {
            conn.setHostnameVerifier(this.hostnameVerifier);
        }
        if (this.sslContext != null) {
            conn.setSSLSocketFactory(this.sslContext.getSocketFactory());
        }
        return conn;
    }
    
    protected void addHeaders(URLConnection conn) throws JSONException {
        Iterator<?> i = this.headers.keys();
        
        Log.d(TAG, this.headers.toString(3));
        while (i.hasNext()) {
            String key = (String)i.next();
            conn.setRequestProperty(key, this.headers.getString(key));
        }
    }
    
    protected String getQueryString() throws JSONException {
        Iterator<?> i = this.params.keys();
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        
        while (i.hasNext()) {
            String key = (String)i.next();
            
            if (!first) {
                sb.append("&");
            } else {
                first = false;
            }
            sb.append(key);
            sb.append("=");
            sb.append(this.params.getString(key));
        }
        
        return sb.toString();
    }
    
    protected String readInputStream(InputStream is) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(is));
        StringBuilder sb = new StringBuilder();
        
        try {
            String line = reader.readLine();
            while (line != null) {
                sb.append(line);
                line = reader.readLine();
            }
            
            return sb.toString();
        } finally {
            reader.close();
        }
    }
    
    protected void respondWithError(CallbackContext callbackContext, String msg) {
        try {
            JSONObject response = new JSONObject();
            response.put("status", 500);
            response.put("error", msg);
            callbackContext.error(response);
        } catch (JSONException e) {
            callbackContext.error(msg);
        }
    }
}
