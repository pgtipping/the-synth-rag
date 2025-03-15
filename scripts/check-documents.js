// Check documents in the database
import pkg from "pg";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const { Pool } = pkg;

async function checkDocuments() {
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    console.log("Checking documents in the database...");

    // Check documents
    const { rows: documents } = await pool.query(
      "SELECT * FROM documents LIMIT 5"
    );
    console.log("Documents:", documents);

    // Check document chunks
    const { rows: chunks } = await pool.query(
      "SELECT * FROM document_chunks LIMIT 5"
    );
    console.log("Document chunks:", chunks);

    console.log("Database check completed!");
  } catch (error) {
    console.error("Error checking documents:", error);
  } finally {
    await pool.end();
  }
}

// Run check
checkDocuments();
