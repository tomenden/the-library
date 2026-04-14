const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Ensure Metro knows the project root is apps/mobile, not the monorepo root
config.projectRoot = projectRoot;

// Watch the monorepo root for changes (shared packages)
config.watchFolders = [monorepoRoot];

// Resolve modules from both the app and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Prevent duplicate React instances in monorepo.
// Force react/react-native to always resolve from the mobile app's node_modules.
const mobileModules = path.resolve(projectRoot, "node_modules");
const forcedModules = {
  react: path.resolve(mobileModules, "react"),
  "react-native": path.resolve(mobileModules, "react-native"),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (forcedModules[moduleName]) {
    return { type: "sourceFile", filePath: require.resolve(moduleName, { paths: [mobileModules] }) };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
