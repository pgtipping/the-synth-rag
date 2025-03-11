import { createProgressTables } from "../src/lib/db/migrations/004_create_progress_tables";

async function migrate() {
  try {
    console.log("Running migrations...");

    // Run migrations in order
    await createProgressTables();

    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
