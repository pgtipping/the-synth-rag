import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log("Starting token usage migration...");

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      "../src/lib/db/migrations/005_create_token_usage_tables.sql"
    );
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    // Begin transaction
    await client.query("BEGIN");

    // Run migration
    await client.query(migrationSql);

    // Commit transaction
    await client.query("COMMIT");

    console.log("Token usage migration completed successfully!");
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
