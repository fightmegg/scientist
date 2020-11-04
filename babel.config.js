const env = process.env.BABEL_ENV || process.env.NODE_ENV || "development";
const isEnvTest = env === "test";

// ES2015+
const envPreset = [
  require.resolve("@babel/preset-env"),
  {
    useBuiltIns: "entry",
    corejs: "core-js@3",
    modules: false,
    targets: "> 0.25%, not dead",
  },
];

// Test Build
const envPresetTest = [
  require.resolve("@babel/preset-env"),
  {
    useBuiltIns: "entry",
    corejs: "core-js@3",
    targets: { node: "current" },
  },
];

// Commons
const commonPlugins = [
  [require.resolve("@babel/plugin-proposal-class-properties"), { lose: true }],
  [require.resolve("@babel/plugin-proposal-private-methods"), { lose: true }],
  [
    require.resolve("@babel/plugin-transform-runtime"),
    {
      regenerator: true,
    },
  ],
];

// Export
module.exports = (api, opts) => {
  console.log("Building for:", env);

  api.cache(true);
  return {
    presets: [!isEnvTest && envPreset, isEnvTest && envPresetTest].filter(
      Boolean
    ),
    plugins: [...commonPlugins].filter(Boolean),
  };
};
