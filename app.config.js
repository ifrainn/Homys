// app.config.js
/** @type {import('@expo/config').ExpoConfig} */
module.exports = () => ({
  name: "Homeday",
  slug: "homeday",
  version: "1.0.0",
  scheme: "homeday",

  icon: "./assets/iconHomeday.png",

  assetBundlePatterns: ["**/*"],

  splash: {
    image: "./assets/iconHomeday.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },

  ios: {
    bundleIdentifier: "com.frain.homeday",
    supportsTablet: false,
    // When you add iOS later:
    // googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST
  },

  android: {
    package: "com.frain.homeday",
    icon: "./assets/iconHomeday.png",
    adaptiveIcon: {
      foregroundImage: "./assets/iconHomeday.png",
      backgroundColor: "#ffffff",
    },
    // <-- EAS provides this path at build time via the file secret
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
  },

  plugins: [
    "@react-native-firebase/app",
    "@react-native-firebase/crashlytics",
  ],

  extra: {
    eas: { projectId: "4804b7c2-274e-496a-bf80-93f00af7f593" },
  },
});
