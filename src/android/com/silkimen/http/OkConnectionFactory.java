package com.silkimen.http;

import java.io.IOException;
import java.net.URL;
import java.net.HttpURLConnection;
import java.net.Proxy;

public class OkConnectionFactory implements HttpRequest.ConnectionFactory {

  public HttpURLConnection create(URL url) {
      try {
          return (HttpURLConnection) url.openConnection();
      } catch (IOException e) {
          e.printStackTrace();
          return null;
      }
  }

  public HttpURLConnection create(URL url, Proxy proxy) {
      try {
          return (HttpURLConnection) url.openConnection(proxy);
      } catch (IOException e) {
          e.printStackTrace();
          return null;
      }
  }
}
