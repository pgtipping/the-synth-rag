import pkg from "pg";
const { Pool } = pkg;
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

async function setupTestDatabase() {
  // Connect to postgres to create test database
  const mainPool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || "5432"),
    database: "postgres", // Connect to default database first
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });

  try {
    console.log("Setting up test database...");

    // Check if database exists
    const result = await mainPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ["rag_test"]
    );

    if (result.rows.length === 0) {
      // Create database if it doesn't exist
      await mainPool.query("CREATE DATABASE rag_test", []);
      console.log("Test database created");
    } else {
      console.log("Test database already exists");
    }

    // Connect to test database
    const testPool = new Pool({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || "5432"),
      database: "rag_test",
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    });

    try {
      // Read and execute schema
      const schemaPath = path.join(
        process.cwd(),
        "src",
        "lib",
        "db",
        "schema.sql"
      );
      const schema = await fs.readFile(schemaPath, "utf-8");

      await testPool.query(schema, []);
      console.log("Schema applied successfully");
    } finally {
      await testPool.end();
    }
  } catch (error) {
    console.error("Error setting up test database:", error);
    throw error;
  } finally {
    await mainPool.end();
  }
}

// Run setup
setupTestDatabase().catch(console.error);
