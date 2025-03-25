package com.silkimen.http;

import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;
import okhttp3.CertificatePinner;
import okhttp3.OkHttpClient;
import okhttp3.OkUrlFactory;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.Proxy;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class OkConnectionFactory implements HttpRequest.ConnectionFactory {

  private static CertificatePinner certificatePinner;
  private final OkHttpClient client;

  public OkConnectionFactory() {
    if (certificatePinner == null) {
      try {
        String jsonConfig = this.loadJson("assets/certificate_settings.json");
        CertificatePinner.Builder pinnerBuilder = new CertificatePinner.Builder();
        JSONObject jsonObject = new JSONObject(jsonConfig);
        JSONArray pins = jsonObject.getJSONArray("certificates_to_pin");

        for (int i = 0; i < pins.length(); i++) {
          JSONObject pin = pins.getJSONObject(i);
          pinnerBuilder.add(pin.getString("domain"), pin.getString("hash"));
        }

        certificatePinner = pinnerBuilder.build();
      } catch (Exception e) {
        throw new RuntimeException("Failed to initialize OkConnectionFactory", e);
      }
    }

    if (certificatePinner == null) {
      throw new RuntimeException("Failed to initialize OkConnectionFactory: no pinner available");
    }

    this.client = new OkHttpClient.Builder()
      .certificatePinner(certificatePinner)
      .build();
  }

  @Override
  public HttpURLConnection create(URL url) throws IOException {
    OkUrlFactory urlFactory = new OkUrlFactory(this.client);
    return (HttpURLConnection) urlFactory.open(url);
  }

  @Override
  public HttpURLConnection create(URL url, Proxy proxy) throws IOException {
    OkHttpClient clientWithProxy = client.newBuilder().proxy(proxy).build();
    OkUrlFactory urlFactory = new OkUrlFactory(clientWithProxy);
    return (HttpURLConnection) urlFactory.open(url);
  }

  private String loadJson(String fileName) throws IOException {
    try (InputStream is = getClass().getClassLoader().getResourceAsStream(fileName)) {
      if (is == null) {
        throw new IOException("Resource not found: " + fileName);
      }
      // Support older Android versions for reading the InputStream
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
      } else {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int bytesRead;
        while ((bytesRead = is.read(buffer)) != -1) {
          baos.write(buffer, 0, bytesRead);
        }
        return baos.toString(StandardCharsets.UTF_8.name());
      }
    }
  }

}
