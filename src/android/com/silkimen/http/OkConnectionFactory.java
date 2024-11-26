package com.silkimen.http;

import okhttp3.CertificatePinner;
import okhttp3.OkHttpClient;
import okhttp3.OkUrlFactory;

import java.net.URL;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URLStreamHandler;
import java.nio.charset.StandardCharsets;
import java.net.Proxy;

public class OkConnectionFactory implements HttpRequest.ConnectionFactory {

  JSONObject jsonObject = new JSONObject(loadJSONFromAsset("certificate_settings.json"));
  CertificatePinner.Builder pinnerBuilder = new CertificatePinner.Builder();

  JSONArray pins = jsonObject.getJSONArray("certificates_to_pin");

  for (int i = 0; i < pins.length(); i++) {
      JSONObject pin = pins.getJSONObject(i);
      pinnerBuilder.add(pin.getString("domain"), pin.getString("hash"));
  }

  OkHttpClient client = new OkHttpClient.Builder()
    .certificatePinner(pinnerBuilder.build())
    .build();

  public HttpURLConnection create(URL url) {
    OkUrlFactory urlFactory = new OkUrlFactory(this.client);

    return (HttpURLConnection) urlFactory.open(url);
  }

  public HttpURLConnection create(URL url, Proxy proxy) {
    OkHttpClient clientWithProxy = new OkHttpClient.Builder().proxy(proxy).build();
    OkUrlFactory urlFactory = new OkUrlFactory(clientWithProxy);

    return (HttpURLConnection) urlFactory.open(url);
  }

  private String loadJSONFromAsset(String fileName) {
    String json = null;
    try (InputStream is = getApplicationContext().getAssets().open(fileName)) {
        int size = is.available();
        byte[] buffer = new byte[size];
        is.read(buffer);
        json = new String(buffer, StandardCharsets.UTF_8);
    } catch (IOException ex) {
        ex.printStackTrace();
    }
    return json;
}
}
