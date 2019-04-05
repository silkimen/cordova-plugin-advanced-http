package com.silkimen.http;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.KeyManager;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

import com.silkimen.http.TLSSocketFactory;

public class TLSConfiguration {
  private TrustManager[] trustManagers;
  private KeyManager[] keyManagers;
  private HostnameVerifier hostnameVerifier;

  private SSLSocketFactory socketFactory;

  public void setHostnameVerifier(HostnameVerifier hostnameVerifier) {
    this.hostnameVerifier = hostnameVerifier;
  }

  public void setKeyManagers(KeyManager[] keyManagers) {
    this.keyManagers = keyManagers;
    this.socketFactory = null;
  }

  public void setTrustManagers(TrustManager[] trustManagers) {
    this.trustManagers = trustManagers;
    this.socketFactory = null;
  }

  public HostnameVerifier getHostnameVerifier() {
    return this.hostnameVerifier;
  }

  public SSLSocketFactory getTLSSocketFactory() throws IOException {
    if (this.socketFactory != null) {
      return this.socketFactory;
    }

    try {
      SSLContext context = SSLContext.getInstance("TLS");

      context.init(this.keyManagers, this.trustManagers, new SecureRandom());

      if (android.os.Build.VERSION.SDK_INT < 20) {
        this.socketFactory = new TLSSocketFactory(context);
      } else {
        this.socketFactory = context.getSocketFactory();
      }

      return this.socketFactory;
    } catch (GeneralSecurityException e) {
      IOException ioException = new IOException("Security exception occured while configuring TLS context");
      ioException.initCause(e);
      throw ioException;
    }
  }
}
