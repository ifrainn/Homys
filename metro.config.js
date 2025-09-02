const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// allow .cjs (Firebase uses them internally)
config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs"];

// IMPORTANT: disable package-exports so Metro doesn't pick the wrong ESM entry
config.resolver.unstable_enablePackageExports = false;

module.exports = config;