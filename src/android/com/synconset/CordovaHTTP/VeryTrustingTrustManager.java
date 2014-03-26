package com.synconset;

import java.security.cert.X509Certificate;
import java.security.cert.CertificateException;
import javax.net.ssl.X509TrustManager;

public class VeryTrustingTrustManager implements X509TrustManager {
    @Override
    public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException, IllegalArgumentException { }
    
    @Override
    public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException, IllegalArgumentException { }
    
    @Override
    public X509Certificate[] getAcceptedIssuers() {
        return new X509Certificate[0];
    }
}