/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset.cordovahttp;

import org.apache.cordova.CallbackContext;

import org.json.JSONException;
import org.json.JSONObject;

import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

import javax.net.ssl.SSLHandshakeException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.Iterator;

import android.text.TextUtils;

import com.github.kevinsawicki.http.HttpRequest;
import com.github.kevinsawicki.http.HttpRequest.HttpRequestException;

abstract class CordovaHttp {
    protected static final String TAG = "CordovaHTTP";
    protected static final String CHARSET = "UTF-8";

    private static AtomicBoolean sslPinning = new AtomicBoolean(false);
    private static AtomicBoolean acceptAllCerts = new AtomicBoolean(false);
    private static AtomicBoolean validateDomainName = new AtomicBoolean(true);
    private static AtomicBoolean disableRedirect = new AtomicBoolean(false);

    private String urlString;
    private Object params;
    private String serializerName;
    private JSONObject headers;
    private int timeoutInMilliseconds;
    private CallbackContext callbackContext;

    public CordovaHttp(String urlString, Object params, JSONObject headers, int timeout, CallbackContext callbackContext) {
        this.urlString = urlString;
        this.params = params;
        this.serializerName = "default";
        this.headers = headers;
        this.timeoutInMilliseconds = timeout;
        this.callbackContext = callbackContext;
    }

    public CordovaHttp(String urlString, Object params, String serializerName, JSONObject headers, int timeout, CallbackContext callbackContext) {
        this.urlString = urlString;
        this.params = params;
        this.serializerName = serializerName;
        this.headers = headers;
        this.timeoutInMilliseconds = timeout;
        this.callbackContext = callbackContext;
    }

    public static void enableSSLPinning(boolean enable) {
        sslPinning.set(enable);
        if (enable) {
            acceptAllCerts.set(false);
        }
    }

    public static void acceptAllCerts(boolean accept) {
        acceptAllCerts.set(accept);
        if (accept) {
            sslPinning.set(false);
        }
    }

    public static void validateDomainName(boolean accept) {
        validateDomainName.set(accept);
    }

    public static void disableRedirect(boolean disable) {
        disableRedirect.set(disable);
    }

    protected String getUrlString() {
        return this.urlString;
    }

    protected Object getParamsObject() {
        return this.params;
    }

    protected String getSerializerName() {
        return this.serializerName;
    }

    protected HashMap<String, Object> getParamsMap() throws JSONException, Exception {
        if (this.params instanceof JSONObject) {
          return this.getMapFromJSONObject((JSONObject) this.params);
        } else {
          throw new Exception("unsupported params type, needs to be a JSON object");
        }
    }

    protected JSONObject getHeadersObject() {
        return this.headers;
    }

    protected HashMap<String, String> getHeadersMap() throws JSONException {
        return this.getStringMapFromJSONObject(this.headers);
    }

    protected int getRequestTimeout() {
        return this.timeoutInMilliseconds;
    }

    protected CallbackContext getCallbackContext() {
        return this.callbackContext;
    }

    protected HttpRequest setupSecurity(HttpRequest request) {
        if (acceptAllCerts.get()) {
            request.trustAllCerts();
        }
        if (!validateDomainName.get()) {
            request.trustAllHosts();
        }
        if (sslPinning.get()) {
            request.pinToCerts();
        }

        return request;
    }

    protected HttpRequest setupRedirect(HttpRequest request) {
        if (disableRedirect.get()) {
            request.followRedirects(false);
        }

        return request;
    }

    protected HttpRequest setupDataSerializer(HttpRequest request) throws JSONException, Exception {
      if (new String("json").equals(this.getSerializerName())) {
          request.contentType(request.CONTENT_TYPE_JSON, request.CHARSET_UTF8);
          request.send(this.getParamsObject().toString());
      } else {
          request.form(this.getParamsMap());
      }

      return request;
    }

    protected void respondWithError(int status, String msg) {
        try {
            JSONObject response = new JSONObject();
            response.put("status", status);
            response.put("error", msg);
            this.callbackContext.error(response);
        } catch (JSONException e) {
            this.callbackContext.error(msg);
        }
    }

    protected void respondWithError(String msg) {
        this.respondWithError(500, msg);
    }

    protected void addResponseHeaders(HttpRequest request, JSONObject response) throws JSONException {
        Map<String, List<String>> headers = request.headers();
        Map<String, String> filteredHeaders = new HashMap<String, String>();

        for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
            String key = entry.getKey();
            List<String> value = entry.getValue();

            if ((key != null) && (!value.isEmpty())) {
                filteredHeaders.put(key.toLowerCase(), TextUtils.join(", ", value));
            }
        }

        response.put("headers", new JSONObject(filteredHeaders));
    }

    protected HashMap<String, String> getStringMapFromJSONObject(JSONObject object) throws JSONException {
        HashMap<String, String> map = new HashMap<String, String>();
        Iterator<?> i = object.keys();

        while (i.hasNext()) {
            String key = (String)i.next();
            map.put(key, object.getString(key));
        }
        return map;
    }

    protected HashMap<String, Object> getMapFromJSONObject(JSONObject object) throws JSONException {
        HashMap<String, Object> map = new HashMap<String, Object>();
        Iterator<?> i = object.keys();

        while(i.hasNext()) {
            String key = (String)i.next();
            map.put(key, object.get(key));
        }
        return map;
    }

    protected void prepareRequest(HttpRequest request) throws HttpRequestException, JSONException {
      this.setupRedirect(request);
      this.setupSecurity(request);
      request.readTimeout(this.getRequestTimeout());
      request.acceptCharset(CHARSET);
      request.headers(this.getHeadersMap());
      request.uncompress(true);
    }

    protected void returnResponseObject(HttpRequest request) throws HttpRequestException {
      try {
        JSONObject response = new JSONObject();
        int code = request.code();
        String body = request.body(CHARSET);

        response.put("status", code);
        response.put("url", request.url().toString());
        this.addResponseHeaders(request, response);

        if (code >= 200 && code < 300) {
            response.put("data", body);
            this.getCallbackContext().success(response);
        } else {
            response.put("error", body);
            this.getCallbackContext().error(response);
        }
      } catch(JSONException e) {
        this.respondWithError("There was an error generating the response");
      }
    }

    protected void handleHttpRequestException(HttpRequestException e) {
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
