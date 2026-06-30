const { spawnSync } = require("child_process");

const mode = process.argv[2] === "demo" ? "demo" : "production";
const env = {
  ...process.env,
  EXPO_PUBLIC_ENABLE_DEMO: mode === "demo" ? "true" : "false",
};

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["expo", "export", "--platform", "web"], {
  stdio: "inherit",
  env,
});

process.exit(result.status || 0);
