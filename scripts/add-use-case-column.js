// Script to add use_case column to documents table
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;

async function addUseCase() {
  const pool = new Pool();

  try {
    console.log("Connecting to database...");
    const client = await pool.connect();

    try {
      console.log("Adding use_case column to documents table...");

      // Check if column already exists
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'use_case'
      `);

      if (checkResult.rows.length > 0) {
        console.log("Column use_case already exists in documents table.");
        return;
      }

      // Start transaction
      await client.query("BEGIN");

      // Add use_case column
      await client.query(`
        ALTER TABLE documents
        ADD COLUMN use_case VARCHAR(50) NOT NULL DEFAULT 'general'
      `);

      // Create index
      await client.query(`
        CREATE INDEX idx_documents_use_case ON documents(use_case)
      `);

      // Commit transaction
      await client.query("COMMIT");

      console.log("Successfully added use_case column to documents table.");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding use_case column:", error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database connection error:", error);
  } finally {
    await pool.end();
  }
}

addUseCase().catch(console.error);
