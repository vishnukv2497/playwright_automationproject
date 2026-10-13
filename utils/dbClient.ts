import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * Runs a parameterized SQL query using a new connection and returns the result rows.
 * @param sql - SQL statement with ? placeholders
 * @param params - Values for the placeholders
 */
export async function executeQuery(sql: string, params?: any[]) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [result] = await connection.execute(sql, params);
    return result;
  } finally {
    // Always release the connection, even when the query fails
    await connection.end();
  }
}
