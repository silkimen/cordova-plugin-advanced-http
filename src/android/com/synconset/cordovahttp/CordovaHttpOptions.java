/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset.cordovahttp;

import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

import javax.net.ssl.SSLHandshakeException;

import org.apache.cordova.CallbackContext;
import org.json.JSONException;
import org.json.JSONObject;

import com.github.kevinsawicki.http.HttpRequest;
import com.github.kevinsawicki.http.HttpRequest.HttpRequestException;

class CordovaHttpOptions extends CordovaHttp implements Runnable {
    public CordovaHttpOptions(String urlString, Object params, JSONObject headers, int timeout, CallbackContext callbackContext) {
        super(urlString, params, headers, timeout, callbackContext);
    }

    @Override
    public void run() {
        try {
            HttpRequest request = HttpRequest.options(this.getUrlString(), this.getParamsMap(), true);

            this.prepareRequest(request);
            this.returnResponseObject(request);
        } catch (HttpRequestException e) {
            this.handleHttpRequestException(e);
        } catch (Exception e) {
            this.respondWithError(e.getMessage());
        }
    }
}
