/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset.cordovahttp;

import org.apache.cordova.CallbackContext;

import org.json.JSONException;
import org.json.JSONArray;
import org.json.JSONObject;

import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

import java.nio.ByteBuffer;

import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.MalformedInputException;

import javax.net.ssl.SSLHandshakeException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.Iterator;

import android.text.TextUtils;

import com.github.kevinsawicki.http.HttpRequest;
import com.github.kevinsawicki.http.HttpRequest.HttpRequestException;

abstract class CordovaHttp {
    protected static final String TAG = "CordovaHTTP";
    protected static final String[] ACCEPTED_CHARSETS = new String[] { HttpRequest.CHARSET_UTF8, HttpRequest.CHARSET_LATIN1 };
    private static AtomicBoolean disableRedirect = new AtomicBoolean(false);

    private String urlString;
    private Object params;
    private String serializerName;
    private JSONObject headers;
    private int timeoutInMilliseconds;
    private CallbackContext callbackContext;

    public CordovaHttp(String urlString, Object params, JSONObject headers, int timeout, CallbackContext callbackContext) {
        this(urlString, params, "default", headers, timeout, callbackContext);
    }

    public CordovaHttp(String urlString, Object params, String serializerName, JSONObject headers, int timeout, CallbackContext callbackContext) {
        this.urlString = urlString;
        this.params = params;
        this.serializerName = serializerName;
        this.headers = headers;
        this.timeoutInMilliseconds = timeout;
        this.callbackContext = callbackContext;
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

    protected HttpRequest setupRedirect(HttpRequest request) {
        if (disableRedirect.get()) {
            request.followRedirects(false);
        }

        return request;
    }

    protected void setupDataSerializer(HttpRequest request) throws JSONException, Exception {
      if ("json".equals(this.getSerializerName())) {
          request.contentType(request.CONTENT_TYPE_JSON, request.CHARSET_UTF8);
      } else if ("utf8".equals(this.getSerializerName())) {
          request.contentType("text/plain", request.CHARSET_UTF8);
      }
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
        this.respondWithError(-1, msg);
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

    protected ArrayList<Object> getListFromJSONArray(JSONArray array) throws JSONException {
      ArrayList<Object> list = new ArrayList<Object>();

      for (int i = 0; i < array.length(); i++) {
          list.add(array.get(i));
      }
      return list;
    }

    protected HashMap<String, Object> getMapFromJSONObject(JSONObject object) throws JSONException {
        HashMap<String, Object> map = new HashMap<String, Object>();
        Iterator<?> i = object.keys();

        while(i.hasNext()) {
            String key = (String)i.next();
            Object value = object.get(key);

            if (value instanceof JSONArray) {
                map.put(key, getListFromJSONArray((JSONArray)value));
            } else {
                map.put(key, object.get(key));
            }
        }
        return map;
    }

    protected void prepareRequest(HttpRequest request) throws HttpRequestException, JSONException {
      this.setupRedirect(request);

      request.readTimeout(this.getRequestTimeout());
      request.acceptCharset(ACCEPTED_CHARSETS);
      request.headers(this.getHeadersMap());
      request.uncompress(true);
    }

    protected void prepareRequestBody(HttpRequest request) throws JSONException, Exception {
      if ("json".equals(this.getSerializerName())) {
          request.send(this.getParamsObject().toString());
      } else if ("utf8".equals(this.getSerializerName())) {
          request.send(this.getParamsMap().get("text").toString());
      } else {
          request.form(this.getParamsMap());
      }
    }

    private CharsetDecoder createCharsetDecoder(final String charsetName) {
      return Charset.forName(charsetName).newDecoder()
        .onMalformedInput(CodingErrorAction.REPORT)
        .onUnmappableCharacter(CodingErrorAction.REPORT);
    }

    private String decodeBody(AtomicReference<ByteBuffer> rawOutput, String charsetName)
      throws CharacterCodingException, MalformedInputException {

      if (charsetName == null) {
        return tryDecodeByteBuffer(rawOutput);
      }

      return decodeByteBuffer(rawOutput, charsetName);
    }

    private String tryDecodeByteBuffer(AtomicReference<ByteBuffer> rawOutput)
      throws CharacterCodingException, MalformedInputException {

      for (int i = 0; i < ACCEPTED_CHARSETS.length - 1; i++) {
        try {
          return decodeByteBuffer(rawOutput, ACCEPTED_CHARSETS[i]);
        } catch (MalformedInputException e) {
          continue;
        } catch (CharacterCodingException e) {
          continue;
        }
      }

      return decodeBody(rawOutput, ACCEPTED_CHARSETS[ACCEPTED_CHARSETS.length - 1]);
    }

    private String decodeByteBuffer(AtomicReference<ByteBuffer> rawOutput, String charsetName)
      throws CharacterCodingException, MalformedInputException {

      return createCharsetDecoder(charsetName).decode(rawOutput.get()).toString();
    }

    protected void returnResponseObject(HttpRequest request) throws HttpRequestException {
      try {
        JSONObject response = new JSONObject();
        int code = request.code();
        AtomicReference<ByteBuffer> rawOutputReference = new AtomicReference<ByteBuffer>();

        request.body(rawOutputReference);
        response.put("status", code);
        response.put("url", request.url().toString());
        this.addResponseHeaders(request, response);

        if (code >= 200 && code < 300) {
            response.put("data", decodeBody(rawOutputReference, request.charset()));
            this.getCallbackContext().success(response);
        } else {
            response.put("error", decodeBody(rawOutputReference, request.charset()));
            this.getCallbackContext().error(response);
        }
      } catch(JSONException e) {
        this.respondWithError("There was an error generating the response");
      } catch(MalformedInputException e) {
        this.respondWithError("Could not decode response data due to malformed data");
      } catch(CharacterCodingException e) {
        this.respondWithError("Could not decode response data due to invalid or unknown charset encoding");
      }
    }

    protected void handleHttpRequestException(HttpRequestException e) {
      if (e.getCause() instanceof UnknownHostException) {
          this.respondWithError(0, "The host could not be resolved: " + e.getMessage());
      } else if (e.getCause() instanceof SocketTimeoutException) {
          this.respondWithError(1, "The request timed out: " + e.getMessage());
      } else if (e.getCause() instanceof SSLHandshakeException) {
          this.respondWithError(-2, "SSL handshake failed: " + e.getMessage());
      } else {
          this.respondWithError("There was an error with the request: " + e.getMessage());
      }
    }
}
