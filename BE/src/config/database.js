import mysql from "mysql2/promise";
import { config } from "./env.js";
import { databaseOptions } from "./database-options.js";

export const pool = mysql.createPool({
  ...databaseOptions,
  database: config.DB_NAME,
  connectionLimit: 10,
  charset: "utf8mb4",
  timezone: "Z",
  dateStrings: true,
  decimalNumbers: true,
});
export async function transaction(fn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
