package com.silkimen.cordovahttp;

import android.app.Activity;
import android.content.Context;
import android.security.KeyChain;
import android.security.KeyChainAliasCallback;
import android.util.Log;

import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;

import javax.net.ssl.KeyManager;

import org.apache.cordova.CallbackContext;

import com.silkimen.http.KeyChainKeyManager;
import com.silkimen.http.TLSConfiguration;

class CordovaClientAuth implements Runnable, KeyChainAliasCallback {
  private static final String TAG = "Cordova-Plugin-HTTP";

  private String mode;
  private String filePath;
  private Activity activity;
  private Context context;
  private TLSConfiguration tlsConfiguration;
  private CallbackContext callbackContext;

  public CordovaClientAuth(final String mode, final String filePath, final Activity activity, final Context context,
      final TLSConfiguration configContainer, final CallbackContext callbackContext) {

    this.mode = mode;
    this.filePath = filePath;
    this.activity = activity;
    this.tlsConfiguration = configContainer;
    this.context = context;
    this.callbackContext = callbackContext;
  }

  @Override
  public void run() {
    if ("systemstore".equals(this.mode)) {
      KeyChain.choosePrivateKeyAlias(this.activity, this, null, null, null, -1, null);
    } else if ("file".equals(this.mode)) {
      this.callbackContext.error("Not implemented, yet");
    } else {
      this.tlsConfiguration.setKeyManagers(null);
      this.callbackContext.success();
    }
  }

  @Override
  public void alias(final String alias) {
    try {
      if (alias == null) {
        throw new Exception("Couldn't get a consent for private key access");
      }

      PrivateKey key = KeyChain.getPrivateKey(this.context, alias);
      X509Certificate[] chain = KeyChain.getCertificateChain(this.context, alias);
      KeyManager keyManager = new KeyChainKeyManager(alias, key, chain);

      this.tlsConfiguration.setKeyManagers(new KeyManager[] { keyManager });

      this.callbackContext.success();
    } catch (Exception e) {
      Log.e(TAG, "Couldn't load private key and certificate pair for authentication", e);
      this.callbackContext.error("Couldn't load private key and certificate pair for authentication");
    }
  }
}
