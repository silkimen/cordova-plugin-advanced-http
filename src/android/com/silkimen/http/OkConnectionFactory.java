package com.silkimen.http;

import okhttp3.OkUrlFactory;
import okhttp3.OkHttpClient;

/**
 * A {@link HttpRequest.ConnectionFactory connection factory} which uses OkHttp.
 * <p/>
 * Call {@link HttpRequest#setConnectionFactory(HttpRequest.ConnectionFactory)}
 * with an instance of this class to enable.
 */
public class OkConnectionFactory implements HttpRequest.ConnectionFactory {
  private final OkHttpClient client;

  public OkConnectionFactory() {
    this(new OkHttpClient());
  }

  public OkConnectionFactory(OkHttpClient client) {
    if (client == null) {
      throw new NullPointerException("Client must not be null.");
    }
    this.client = client;
  }

  public HttpURLConnection create(URL url) throws IOException {
    return client.open(url);
  }

  public HttpURLConnection create(URL url, Proxy proxy) throws IOException {
    throw new UnsupportedOperationException(
        "Per-connection proxy is not supported. Use OkHttpClient's setProxy instead.");
  }
}
