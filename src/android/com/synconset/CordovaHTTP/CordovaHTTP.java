/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset;

import java.util.Iterator;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Base64;
 
public class CordovaHTTP extends CordovaPlugin {
    private static final String TAG = "CordovaHTTP";
    
    private JSONObject globalHeaders;
    
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        this.globalHeaders = new JSONObject();
    }

    @Override
    public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("get")) {
            String urlString = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            this.addToJSONObject(headers, this.globalHeaders);
            HTTPGet get = new HTTPGet(urlString, params, headers, callbackContext);
            cordova.getThreadPool().execute(get);
        } else if (action.equals("post")) {
            String urlString = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            this.addToJSONObject(headers, this.globalHeaders);
            HTTPPost post = new HTTPPost(urlString, params, headers, callbackContext);
            cordova.getThreadPool().execute(post);
        } else if (action.equals("setAuthorizationHeaderWithUsernameAndPassword")) {
            String username = args.getString(0);
            String password = args.getString(1);
            this.setAuthorizationHeaderWithUsernameAndPassword(username, password);
            callbackContext.success();
        } else if (action.equals("downloadFile")) {
            
        } else {
            return false;
        }
        return true;
    }

    private void setAuthorizationHeaderWithUsernameAndPassword(String username, String password) throws JSONException {
        String loginInfo = username + ":" + password;
        loginInfo = "Basic " + Base64.encodeToString(loginInfo.getBytes(), Base64.DEFAULT);
        globalHeaders.put("Authorization", loginInfo);
    }

    private void addToJSONObject(JSONObject object, JSONObject objectToAdd) throws JSONException {
        Iterator<?> i = objectToAdd.keys();
        
        while (i.hasNext()) {
            String key = (String)i.next();
            if (!object.has(key)) {
                object.put(key, objectToAdd.getString(key));
            }
        }
    }
}
