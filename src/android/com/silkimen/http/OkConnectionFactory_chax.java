package com.github.kevinsawicki.http;

import okhttp3.OkUrlFactory;
import okhttp3.OkHttpClient;

import java.net.URL;
import java.net.HttpURLConnection;
import java.net.URLStreamHandler;
import java.net.Proxy;

public class OkConnectionFactory implements HttpRequest.ConnectionFactory {

  protected OkHttpClient okHttpClient = new OkHttpClient();

  public HttpURLConnection create(URL url) {
    OkUrlFactory okUrlFactory = new OkUrlFactory(okHttpClient);
    return (HttpURLConnection) okUrlFactory.open(url);
  }

  public HttpURLConnection create(URL url, Proxy proxy) {
    OkHttpClient okHttpClientWithProxy = okHttpClient.newBuilder().proxy(proxy).build();
    OkUrlFactory okUrlFactory = new OkUrlFactory(okHttpClientWithProxy);
    return (HttpURLConnection) okUrlFactory.open(url);
  }
}
