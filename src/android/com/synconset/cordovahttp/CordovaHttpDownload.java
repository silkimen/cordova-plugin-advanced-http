/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset.cordovahttp;

import com.github.kevinsawicki.http.HttpRequest;
import com.github.kevinsawicki.http.HttpRequest.HttpRequestException;

import java.io.File;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.net.URI;
import java.net.URISyntaxException;

import javax.net.ssl.SSLHandshakeException;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.file.FileUtils;

import org.json.JSONException;
import org.json.JSONObject;

class CordovaHttpDownload extends CordovaHttp implements Runnable {
    private String filePath;

    public CordovaHttpDownload(String urlString, JSONObject params, JSONObject headers, CallbackContext callbackContext, String filePath, int timeout) {
        super(urlString, params, headers, timeout, callbackContext);
        this.filePath = filePath;
    }

    @Override
    public void run() {
        try {
            HttpRequest request = HttpRequest.get(this.getUrlString(), this.getParamsMap(), true);

            request.readTimeout(this.getRequestTimeout());
            this.setupSecurity(request);
            request.acceptCharset(CHARSET);
            request.headers(this.getHeadersMap());
            request.uncompress(true);
            int code = request.code();

            JSONObject response = new JSONObject();
            this.addResponseHeaders(request, response);
            response.put("status", code);
            if (code >= 200 && code < 300) {
                URI uri = new URI(filePath);
                File file = new File(uri);
                request.receive(file);
                JSONObject fileEntry = FileUtils.getFilePlugin().getEntryForFile(file);
                response.put("file", fileEntry);
                this.getCallbackContext().success(response);
            } else {
                response.put("error", "There was an error downloading the file");
                this.getCallbackContext().error(response);
            }
        } catch(URISyntaxException e) {
            this.respondWithError("There was an error with the given filePath");
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
