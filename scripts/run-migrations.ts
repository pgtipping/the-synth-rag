import { db } from "@/src/lib/db";
import { promises as fs } from "fs";
import path from "path";

async function runMigrations() {
  try {
    console.log("Starting database migrations...");

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), "src/lib/db/migrations");
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    // Create migrations table if it doesn't exist
    await db.query(`
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
      const { rows } = await db.query(
        "SELECT id FROM migrations WHERE name = $1",
        [migrationName]
      );

      if (rows.length === 0) {
        console.log(`Running migration: ${migrationName}`);

        // Read and execute migration file
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, "utf8");

        await db.query("BEGIN");
        try {
          await db.query(sql);
          await db.query("INSERT INTO migrations (name) VALUES ($1)", [
            migrationName,
          ]);
          await db.query("COMMIT");
          console.log(`Successfully executed migration: ${migrationName}`);
        } catch (error) {
          await db.query("ROLLBACK");
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
    await db.end();
  }
}

// Run migrations
runMigrations();
