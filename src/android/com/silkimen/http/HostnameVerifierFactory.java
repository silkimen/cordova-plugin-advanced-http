package com.silkimen.http;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLSession;

public class HostnameVerifierFactory {
  private final HostnameVerifier noOpVerifier;

  public HostnameVerifierFactory() {
    this.noOpVerifier = new HostnameVerifier() {
      public boolean verify(String hostname, SSLSession session) {
        return true;
      }
    };
  }

  public HostnameVerifier getNoOpVerifier() {
    return this.noOpVerifier;
  }
}
