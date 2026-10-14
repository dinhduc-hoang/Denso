import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const npmCli = process.env.npm_execpath;
if (!npmCli)
  throw new Error(
    "Run the build using npm run build from the repository root.",
  );
const env = { ...process.env, VITE_DEMO_MODE: "false", VITE_API_URL: "/api" };
async function npm(args) {
  const child = spawn(process.execPath, [npmCli, ...args], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Build step exited with code ${code}`)),
    );
  });
}
await npm(["ci", "--prefix", "BE", "--omit=dev", "--no-audit", "--no-fund"]);
await npm(["ci", "--prefix", "FE", "--include=dev", "--no-audit", "--no-fund"]);
await npm(["run", "build", "--prefix", "FE"]);
