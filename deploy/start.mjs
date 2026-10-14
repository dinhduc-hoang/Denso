import { fileURLToPath } from "node:url";

// Load BE/.env only in local runs; hosting injects its environment variables.
process.chdir(fileURLToPath(new URL("../BE/", import.meta.url)));
await import("../BE/scripts/start-cloud.js");
