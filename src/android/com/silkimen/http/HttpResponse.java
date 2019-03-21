package com.silkimen.http;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

import android.text.TextUtils;
import android.util.Log;

public class HttpResponse {
  private int status;
  private String url;
  private Map<String, List<String>> headers;
  private String body;
  private boolean failed;
  private String error;

  public void setStatus(int status) {
    this.status = status;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public void setHeaders(Map<String, List<String>> headers) {
    this.headers = headers;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public void setErrorMessage(String message) {
    this.failed = true;
    this.error = message;
  }

  public boolean hasFailed() {
    return this.failed;
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject json = new JSONObject();

    json.put("status", this.status);
    json.put("url", this.url);

    if (this.failed) {
      json.put("error", this.error);
    } else {
      json.put("headers", new JSONObject(getFilteredHeaders()));
      json.put("data", this.body);
    }

    return json;
  }

  private Map<String, String> getFilteredHeaders() throws JSONException {
    Map<String, String> filteredHeaders = new HashMap<String, String>();

    if (this.headers == null || this.headers.isEmpty()) {
      return filteredHeaders;
    }

    for (Map.Entry<String, List<String>> entry : this.headers.entrySet()) {
      String key = entry.getKey();
      List<String> value = entry.getValue();

      if ((key != null) && (!value.isEmpty())) {
        filteredHeaders.put(key.toLowerCase(), TextUtils.join(", ", value));
      }
    }

    return filteredHeaders;
  }
}
