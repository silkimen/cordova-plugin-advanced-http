/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset.cordovahttp;

import java.io.File;

import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.net.URI;
import java.net.URISyntaxException;

import java.util.Iterator;
import java.util.Map.Entry;
import java.util.Set;

import org.apache.cordova.CallbackContext;

import org.json.JSONException;
import org.json.JSONObject;

import javax.net.ssl.SSLHandshakeException;

import android.webkit.MimeTypeMap;

import com.github.kevinsawicki.http.HttpRequest;
import com.github.kevinsawicki.http.HttpRequest.HttpRequestException;

class CordovaHttpUpload extends CordovaHttp implements Runnable {
    private String filePath;
    private String name;

    public CordovaHttpUpload(String urlString, Object params, JSONObject headers, String filePath, String name, int timeout, CallbackContext callbackContext) {
        super(urlString, params, headers, timeout, callbackContext);
        this.filePath = filePath;
        this.name = name;
    }

    @Override
    public void run() {
        try {
            HttpRequest request = HttpRequest.post(this.getUrlString());

            this.prepareRequest(request);

            URI uri = new URI(filePath);

            int filenameIndex = filePath.lastIndexOf('/');
            String filename = filePath.substring(filenameIndex + 1);

            int extIndex = filePath.lastIndexOf('.');
            String ext = filePath.substring(extIndex + 1);

            MimeTypeMap mimeTypeMap = MimeTypeMap.getSingleton();
            String mimeType = mimeTypeMap.getMimeTypeFromExtension(ext);

            Set<?> set = (Set<?>)this.getParamsMap().entrySet();
            Iterator<?> i = set.iterator();

            while (i.hasNext()) {
                Entry<?, ?> e = (Entry<?, ?>)i.next();
                String key = (String)e.getKey();
                Object value = e.getValue();
                if (value instanceof Number) {
                    request.part(key, (Number)value);
                } else if (value instanceof String) {
                    request.part(key, (String)value);
                } else {
                    this.respondWithError("All parameters must be Numbers or Strings");
                    return;
                }
            }
          
            request.part(this.name, filename, mimeType, new File(uri));

            this.returnResponseObject(request);
        } catch (URISyntaxException e) {
            this.respondWithError("There was an error loading the file");
        } catch (JSONException e) {
            this.respondWithError("There was an error generating the response");
        } catch (HttpRequestException e) {
            this.handleHttpRequestException(e);
        } catch (Exception e) {
          this.respondWithError(e.getMessage());
        }
    }
}
