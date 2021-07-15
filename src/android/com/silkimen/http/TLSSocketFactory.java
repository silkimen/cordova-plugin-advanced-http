package com.silkimen.http;

import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.net.UnknownHostException;

import java.util.Arrays;
import java.util.stream.Stream;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

public class TLSSocketFactory extends SSLSocketFactory {

  private SSLSocketFactory delegate;
  private String[] blacklistedProtocols;

  public TLSSocketFactory(SSLContext context, String[] blacklistedProtocols) {
    this.delegate = context.getSocketFactory();
    this.blacklistedProtocols = Arrays.stream(blacklistedProtocols).map(String::trim).toArray(String[]::new);
  }

  @Override
  public String[] getDefaultCipherSuites() {
    return delegate.getDefaultCipherSuites();
  }

  @Override
  public String[] getSupportedCipherSuites() {
    return delegate.getSupportedCipherSuites();
  }

  @Override
  public Socket createSocket(Socket socket, String host, int port, boolean autoClose) throws IOException {
    return enableTLSOnSocket(delegate.createSocket(socket, host, port, autoClose));
  }

  @Override
  public Socket createSocket(String host, int port) throws IOException, UnknownHostException {
    return enableTLSOnSocket(delegate.createSocket(host, port));
  }

  @Override
  public Socket createSocket(String host, int port, InetAddress localHost, int localPort)
      throws IOException, UnknownHostException {
    return enableTLSOnSocket(delegate.createSocket(host, port, localHost, localPort));
  }

  @Override
  public Socket createSocket(InetAddress host, int port) throws IOException {
    return enableTLSOnSocket(delegate.createSocket(host, port));
  }

  @Override
  public Socket createSocket(InetAddress address, int port, InetAddress localAddress, int localPort)
      throws IOException {
    return enableTLSOnSocket(delegate.createSocket(address, port, localAddress, localPort));
  }

  private Socket enableTLSOnSocket(Socket socket) {
    if (socket == null || !(socket instanceof SSLSocket)) {
      return socket;
    }

    String[] supported = ((SSLSocket) socket).getSupportedProtocols();

    String[] filtered = Arrays.stream(supported).filter(
      val -> Arrays.stream(this.blacklistedProtocols).noneMatch(val::equals)
    ).toArray(String[]::new);

    ((SSLSocket) socket).setEnabledProtocols(filtered);

    return socket;
  }
}
