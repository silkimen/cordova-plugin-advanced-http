package com.silkimen.http;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.ArrayList;

import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

public class TrustManagersFactory {
  private final TrustManager[] noOpTrustManager;

  public TrustManagersFactory() {
    this.noOpTrustManager = new TrustManager[] { new X509TrustManager() {
      public X509Certificate[] getAcceptedIssuers() {
        return new X509Certificate[0];
      }

      public void checkClientTrusted(X509Certificate[] chain, String authType) {
        // intentionally left blank
      }

      public void checkServerTrusted(X509Certificate[] chain, String authType) {
        // intentionally left blank
      }
    } };
  }

  public TrustManager[] getNoopTrustManagers() {
    return this.noOpTrustManager;
  }

  public TrustManager[] getPinnedTrustManagers(ArrayList<Certificate> pinnedCerts) throws IOException {
    if (pinnedCerts == null || pinnedCerts.size() == 0) {
      throw new IOException("You must add at least 1 certificate in order to pin to certificates");
    }

    try {
      String keyStoreType = KeyStore.getDefaultType();
      KeyStore keyStore = KeyStore.getInstance(keyStoreType);
      keyStore.load(null, null);

      for (int i = 0; i < pinnedCerts.size(); i++) {
        keyStore.setCertificateEntry("CA" + i, pinnedCerts.get(i));
      }

      // Create a TrustManager that trusts the CAs in our KeyStore
      String tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
      TrustManagerFactory tmf = TrustManagerFactory.getInstance(tmfAlgorithm);
      tmf.init(keyStore);

      return tmf.getTrustManagers();
    } catch (GeneralSecurityException e) {
      IOException ioException = new IOException("Security exception configuring SSL trust managers");
      ioException.initCause(e);

      throw ioException;
    }
  }
}
