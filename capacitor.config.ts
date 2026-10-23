import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nikahpathway.ios",
  appName: "NikahPathway",
  webDir: "www",
  server: {
    // The app is a native shell around the live, server-rendered site rather
    // than a bundled static export (the site needs server actions, cookies
    // and Supabase SSR auth, none of which survive a static export).
    url: "https://nikahpathway.com",
    cleartext: false,
  },
  ios: {
    // Lets the server tell this build apart from older builds that have no
    // native billing code (see isIosAppWithPurchases in
    // src/lib/native-app.ts): only builds carrying this token are shown
    // the In-App Purchase membership UI.
    appendUserAgent: "NikahPathwayIosApp",
  },
  android: {
    // Matches --color-primary in src/app/globals.css.
    backgroundColor: "#0b5d42",
    // Lets the server tell this WebView apart from any other Android
    // browser (see isAndroidApp in src/lib/native-app.ts) to route purchase
    // UI through native Play Billing instead of Stripe checkout.
    appendUserAgent: "NikahPathwayAndroidApp",
  },
};

export default config;
