/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.MalformedURLException;

import java.net.URL;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.HostnameVerifier;

import org.apache.cordova.CallbackContext;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;
 
public class CordovaHttpPost extends CordovaHttp implements Runnable {
    public CordovaHttpPost(String urlString, JSONObject params, JSONObject headers, SSLContext sslContext, HostnameVerifier hostnameVerifier, CallbackContext callbackContext) {
        super(urlString, params, headers, sslContext, hostnameVerifier, callbackContext);
    }
    
    @Override
    public void run() {
        String urlString = this.getUrlString();
        CallbackContext callbackContext = this.getCallbackContext();

        InputStream is = null;
        HttpsURLConnection conn = null;
        try {
            conn = this.openConnection(urlString);
            conn.setRequestMethod("POST");
            conn.setDoInput(true);
            conn.setDoOutput(true);
            conn.setChunkedStreamingMode(0);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setRequestProperty("Accept-Charset", charset);
            this.addHeaders(conn);

            OutputStream out = conn.getOutputStream();
            OutputStreamWriter writer = new OutputStreamWriter(out, charset);
            writer.write(this.getQueryString());
            writer.close();
            out.close();

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
            Log.d(TAG, e.getMessage());
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
