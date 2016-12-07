/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset.cordovahttp;

import java.net.UnknownHostException;

import org.apache.cordova.CallbackContext;
import org.json.JSONException;
import org.json.JSONObject;

import javax.net.ssl.SSLHandshakeException;

import com.github.kevinsawicki.http.HttpRequest;
import com.github.kevinsawicki.http.HttpRequest.HttpRequestException;

class CordovaHttpPut extends CordovaHttp implements Runnable {
    public CordovaHttpPut(String urlString, JSONObject data, String serializerName, JSONObject headers, CallbackContext callbackContext) {
        super(urlString, data, serializerName, headers, callbackContext);
    }

    @Override
    public void run() {
        try {
            HttpRequest request = HttpRequest.put(this.getUrlString());

            this.setupSecurity(request);
            request.acceptCharset(CHARSET);
            request.headers(this.getHeadersMap());

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
        }  catch (HttpRequestException e) {
            if (e.getCause() instanceof UnknownHostException) {
                this.respondWithError(0, "The host could not be resolved");
            } else if (e.getCause() instanceof SSLHandshakeException) {
                this.respondWithError("SSL handshake failed");
            } else {
                this.respondWithError("There was an error with the request");
            }
        }
    }
}
