import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";

const admin = JSON.parse(
  await readFile(
    new URL("../.local/mysql-admin.json", import.meta.url),
    "utf8",
  ),
);
const connection = await mysql.createConnection({
  host: "127.0.0.1",
  port: admin.port,
  user: "root",
  password: admin.password,
});
try {
  if (process.argv[2] === "stop") {
    await connection.query("SHUTDOWN");
    console.log("Local MySQL stopped. Database files preserved.");
  } else {
    await connection.ping();
    console.log(`Local MySQL ready at 127.0.0.1:${admin.port}.`);
  }
} finally {
  await connection.end();
}
