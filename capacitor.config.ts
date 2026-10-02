import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nikahpathway.app",
  appName: "NikahPathway",
  webDir: "www",
  server: {
    // The app is a native shell around the live, server-rendered site rather
    // than a bundled static export (the site needs server actions, cookies
    // and Supabase SSR auth, none of which survive a static export).
    url: "https://nikahpathway.com",
    cleartext: false,
  },
  android: {
    // Matches --color-primary in src/app/globals.css.
    backgroundColor: "#0b5d42",
  },
};

export default config;
