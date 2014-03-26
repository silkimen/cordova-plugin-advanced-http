/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.HostnameVerifier;

import org.apache.cordova.CallbackContext;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;
 
public class CordovaHttpGet extends CordovaHttp implements Runnable {
    public CordovaHttpGet(String urlString, JSONObject params, JSONObject headers, SSLContext sslContext, HostnameVerifier hostnameVerifier, CallbackContext callbackContext) {
        super(urlString, params, headers, sslContext, hostnameVerifier, callbackContext);
    }
    
    @Override
    public void run() {
        JSONObject params = this.getParams();
        String urlString = this.getUrlString();
        CallbackContext callbackContext = this.getCallbackContext();
        
        InputStream is = null;
        HttpsURLConnection conn = null;
        try {
            if (params.length() > 0) {
                urlString = urlString + "?" + this.getQueryString();
            }
            conn = this.openConnection(urlString);
            conn.setRequestMethod("GET");
            conn.setDoInput(true);
            conn.setRequestProperty("Accept-Charset", charset);
            this.addHeaders(conn);
            conn.connect();
            int status = conn.getResponseCode();
            if (status >= 200 && status < 300) {
                is = conn.getInputStream();
                String responseData = this.readInputStream(is);
                JSONObject response = new JSONObject();
                response.put("status", status);
                response.put("data", responseData);
                callbackContext.success(response);
            } else {
                is = conn.getErrorStream();
                String responseData = this.readInputStream(is);
                JSONObject response = new JSONObject();
                response.put("status", status);
                response.put("error", responseData);
                callbackContext.error(response);
            }
        } catch (MalformedURLException e) {
            this.respondWithError(callbackContext, "There is an error with the url");
        } catch (JSONException e) {
            this.respondWithError(callbackContext, "There was an error with the params, headers or generating the response");
        } catch (IOException e) {
            this.respondWithError(callbackContext, "There was an error with the request");
        } finally {
            if (is != null) {
                try {
                    is.close();
                } catch (IOException e) {}
            }
            if (conn != null) {
                conn.disconnect();
            }
        }
    }
}