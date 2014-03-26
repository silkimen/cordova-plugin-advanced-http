package com.synconset;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLSession;

public class VeryTrustingHostnameVerifier implements HostnameVerifier {
    @Override
    public boolean verify(String hostname, SSLSession session) {
        return true;
    }
}