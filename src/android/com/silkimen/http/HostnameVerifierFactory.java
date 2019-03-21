package com.silkimen.http;

import javax.net.ssl.HostnameVerifier;

public class HostnameVerfifierFactory {
  private final HostnameVerifier noOpVerififer;

  public HostnameVerifierFactory() {
    this.noOpVerififer = new HostnameVerifier() {
      public boolean verify(String hostname, SSLSession session) {
        return true;
      }
    };
  }

  public HostnameVerifier getNoOpVerifier() {
    return this.noOpVerififer;
  }
}
