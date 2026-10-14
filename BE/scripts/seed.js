import { pool } from "../src/config/database.js";
import { seedDatabase } from "../src/tools/seed.js";

try {
  const result = await seedDatabase(process.env.SEED_PASSWORD, {
    minimal: process.argv.includes("--minimal"),
  });
  console.log(JSON.stringify(result, null, 2));
  console.log(
    "Seed complete. Existing accounts, passwords and records were preserved. Login with SEED_PASSWORD for newly created demo accounts.",
  );
} finally {
  await pool.end();
}
