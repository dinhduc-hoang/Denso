import { createApp } from "./app.js";
import { pool } from "./config/database.js";
import { config } from "./config/env.js";

await pool.query("SELECT 1");
const server = createApp().listen(config.PORT, config.HOST, () =>
  console.log(`Backend listening on http://${config.HOST}:${config.PORT}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    const deadline = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      await pool.end();
      clearTimeout(deadline);
      process.exit(0);
    });
  });
