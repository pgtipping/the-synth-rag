import { storage } from "../lib/storage";
import { DocumentService } from "../lib/services/document-service";
import pool from "../lib/db";
import { indexDocument, searchSimilar } from "../lib/pinecone-index";
import fs from "fs/promises";
import path from "path";

async function testStorageAndIndexing() {
  try {
    console.log("Starting storage and indexing test...");

    // 1. Test file upload
    console.log("\n1. Testing file upload...");
    const testFilePath = path.join(process.cwd(), "test-files", "sample.txt");
    const fileContent = "This is a test document for storage and indexing.";

    // Create test file
    await fs.mkdir(path.join(process.cwd(), "test-files"), { recursive: true });
    await fs.writeFile(testFilePath, fileContent);

    // Read file as buffer
    const buffer = await fs.readFile(testFilePath);

    // Create document
    const documentService = new DocumentService(pool);
    const document = await documentService.createDocument({
      originalName: "sample.txt",
      contentType: "text/plain",
      sizeBytes: buffer.length,
      buffer,
    });

    console.log("Document created:", document);

    // 2. Test file retrieval
    console.log("\n2. Testing file retrieval...");
    const retrievedDoc = await documentService.getDocument(document.id);
    console.log("Retrieved document:", retrievedDoc);

    const storedFile = await storage.retrieve(retrievedDoc!.filename);
    const retrievedContent = storedFile.toString();
    console.log("Retrieved content:", retrievedContent);

    if (retrievedContent !== fileContent) {
      throw new Error("Retrieved content doesn't match original content");
    }

    // 3. Test Pinecone indexing
    console.log("\n3. Testing Pinecone indexing...");
    const vectorId = await indexDocument(retrievedContent, {
      documentId: document.id,
      chunkIndex: 0,
      originalName: document.originalName,
      mimeType: document.contentType,
      processedAt: new Date().toISOString(),
      text: retrievedContent,
    });

    console.log("Document indexed with vector ID:", vectorId);

    // 4. Test search
    console.log("\n4. Testing search...");
    const searchResults = await searchSimilar("test document", {
      topK: 1,
      filter: { documentId: document.id },
    });

    console.log("Search results:", searchResults);

    // 5. Cleanup
    console.log("\n5. Cleaning up...");
    await documentService.deleteDocument(document.id);
    await fs.unlink(testFilePath);

    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test
testStorageAndIndexing().catch(console.error);
