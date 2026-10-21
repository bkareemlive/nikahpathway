package com.nikahpathway.app;

import com.getcapacitor.BridgeActivity;
import com.nikahpathway.app.billing.GooglePlayBillingPlugin;

public class MainActivity extends BridgeActivity {
    {
        registerPlugin(GooglePlayBillingPlugin.class);
    }
}
