import { migrateDatabase } from "./migrate.js";
import { seedDatabase } from "../src/tools/seed.js";
import { pool } from "../src/config/database.js";

try {
  await migrateDatabase();
  if (process.env.SEED_PASSWORD) {
    const { totals } = await seedDatabase(process.env.SEED_PASSWORD);
    console.log(JSON.stringify({ event: "seed.complete", totals }));
  }
  await import("../src/server.js");
} catch (error) {
  console.error(
    JSON.stringify({ event: "startup.failed", code: error.code ?? error.name }),
  );
  await pool.end();
  process.exitCode = 1;
}
