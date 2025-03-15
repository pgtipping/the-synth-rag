// Create document chunks for existing documents
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

async function createDocumentChunks() {
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    console.log("Creating document chunks for existing documents...");

    // Get all documents
    const { rows: documents } = await pool.query(
      "SELECT * FROM documents WHERE status = $1",
      ["indexed"]
    );
    console.log(`Found ${documents.length} indexed documents`);

    // Create chunks for each document
    for (const doc of documents) {
      console.log(
        `Creating chunks for document ${doc.id}: ${doc.original_name}`
      );

      // Create a sample chunk for the document
      const sampleText = `This is a sample chunk for document ${doc.original_name}. 
      This document was uploaded on ${doc.created_at} and has a size of ${doc.size_bytes} bytes.
      This is just a placeholder text since we don't have access to the actual document content.
      In a real scenario, we would extract text from the document and create meaningful chunks.`;

      // Insert the chunk into the database
      await pool.query(
        `INSERT INTO document_chunks 
        (document_id, chunk_index, text_content, token_count, metadata) 
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (document_id, chunk_index) DO NOTHING`,
        [
          doc.id,
          0,
          sampleText,
          Math.floor(sampleText.length / 4),
          JSON.stringify({ source: "sample" }),
        ]
      );

      console.log(`Created chunk for document ${doc.id}`);
    }

    console.log("Document chunks creation completed!");
  } catch (error) {
    console.error("Error creating document chunks:", error);
  } finally {
    await pool.end();
  }
}

// Run the function
createDocumentChunks();
