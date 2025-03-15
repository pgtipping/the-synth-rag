// Run SQL migrations
import { promises as fs } from "fs";
import path from "path";
import pkg from "pg";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as dotenv from "dotenv";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const { Pool } = pkg;

async function runMigrations() {
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  try {
    console.log("Starting database migrations...");

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), "migrations");
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Run each migration
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, ".sql");

      // Check if migration has already been executed
      const { rows } = await pool.query(
        "SELECT id FROM migrations WHERE name = $1",
        [migrationName]
      );

      if (rows.length === 0) {
        console.log(`Running migration: ${migrationName}`);

        // Read and execute migration file
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, "utf8");

        await pool.query("BEGIN");
        try {
          await pool.query(sql);
          await pool.query("INSERT INTO migrations (name) VALUES ($1)", [
            migrationName,
          ]);
          await pool.query("COMMIT");
          console.log(`Successfully executed migration: ${migrationName}`);
        } catch (error) {
          await pool.query("ROLLBACK");
          console.error(`Error executing migration ${migrationName}:`, error);
          throw error;
        }
      } else {
        console.log(`Skipping already executed migration: ${migrationName}`);
      }
    }

    console.log("Database migrations completed successfully!");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
