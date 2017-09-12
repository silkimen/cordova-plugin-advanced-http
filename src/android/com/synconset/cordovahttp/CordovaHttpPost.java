/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset.cordovahttp;

import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

import org.apache.cordova.CallbackContext;
import org.json.JSONException;
import org.json.JSONObject;

import javax.net.ssl.SSLHandshakeException;

import com.github.kevinsawicki.http.HttpRequest;
import com.github.kevinsawicki.http.HttpRequest.HttpRequestException;

class CordovaHttpPost extends CordovaHttp implements Runnable {
    public CordovaHttpPost(String urlString, JSONObject params, String serializerName, JSONObject headers, CallbackContext callbackContext, int timeout) {
        super(urlString, params, serializerName, headers, timeout, callbackContext);
    }

    @Override
    public void run() {
        try {
            HttpRequest request = HttpRequest.post(this.getUrlString());

            request.readTimeout(this.getRequestTimeout());
            this.setupSecurity(request);
            request.acceptCharset(CHARSET);
            request.headers(this.getHeadersMap());
            request.uncompress(true);

            if (new String("json").equals(this.getSerializerName())) {
                request.contentType(request.CONTENT_TYPE_JSON, request.CHARSET_UTF8);
                request.send(this.getParamsObject().toString());
            } else {
                request.form(this.getParamsMap());
            }

            int code = request.code();
            String body = request.body(CHARSET);
            JSONObject response = new JSONObject();

            this.addResponseHeaders(request, response);
            response.put("status", code);

            if (code >= 200 && code < 300) {
                response.put("data", body);
                this.getCallbackContext().success(response);
            } else {
                response.put("error", body);
                this.getCallbackContext().error(response);
            }
        } catch (JSONException e) {
            this.respondWithError("There was an error generating the response");
        } catch (HttpRequestException e) {
            if (e.getCause() instanceof UnknownHostException) {
                this.respondWithError(0, "The host could not be resolved");
            } else if (e.getCause() instanceof SocketTimeoutException) {
                this.respondWithError(1, "The request timed out");
            } else if (e.getCause() instanceof SSLHandshakeException) {
                this.respondWithError("SSL handshake failed");
            } else {
                this.respondWithError("There was an error with the request");
            }
        }
    }
}
