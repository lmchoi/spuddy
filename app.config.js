const { expo } = require("./app.json");

const variant = process.env.APP_VARIANT ?? "production";

const variants = {
  development: {
    name: "Spuddy (Dev)",
    android: { package: "com.mchoi.spuddy.dev" },
    ios: { bundleIdentifier: "com.mchoi.spuddy.dev" },
  },
  preview: {
    name: "Spuddy (Preview)",
    android: { package: "com.mchoi.spuddy.preview" },
    ios: { bundleIdentifier: "com.mchoi.spuddy.preview" },
  },
  prerelease: {
    name: "Spuddy (Pre-release)",
    android: { package: "com.mchoi.spuddy.prerelease" },
    ios: { bundleIdentifier: "com.mchoi.spuddy.prerelease" },
  },
  production: {
    name: expo.name,
    android: { package: expo.android.package },
    ios: { bundleIdentifier: "com.mchoi.spuddy" },
  },
};

const selected = variants[variant] ?? variants.production;

module.exports = {
  expo: {
    ...expo,
    name: selected.name,
    android: {
      ...expo.android,
      ...selected.android,
    },
    ios: {
      ...expo.ios,
      ...selected.ios,
    },
    extra: {
      ...expo.extra,
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST || 'https://eu.i.posthog.com',
    },
  },
};
