package com.silkimen.http;

import okhttp3.OkHttpClient;
import okhttp3.OkUrlFactory;

import java.net.URL;
import java.net.HttpURLConnection;
import java.net.URLStreamHandler;
import java.net.Proxy;

public class OkConnectionFactory implements HttpRequest.ConnectionFactory {
  private final OkHttpClient client = new OkHttpClient();

  public HttpURLConnection create(URL url) {
    OkUrlFactory urlFactory = new OkUrlFactory(this.client);

    return (HttpURLConnection) urlFactory.open(url);
  }

  public HttpURLConnection create(URL url, Proxy proxy) {
    OkHttpClient clientWithProxy = new OkHttpClient.Builder().proxy(proxy).build();
    OkUrlFactory urlFactory = new OkUrlFactory(clientWithProxy);

    return (HttpURLConnection) urlFactory.open(url);
  }
}
