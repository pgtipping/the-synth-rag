import { storage } from "../lib/storage";
import { DocumentService } from "../lib/services/document-service";
import pool from "../lib/db";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

async function testStorage() {
  try {
    console.log("Starting storage test...");

    // 1. Test file upload
    console.log("\n1. Testing file upload...");
    const testFilePath = path.join(process.cwd(), "test-files", "sample.txt");
    const fileContent = "This is a test document for storage.";

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

    // Extract UUID from storage URL
    const fileId = retrievedDoc!.storageUrl.split("/").pop()!;
    const storedFile = await storage.retrieve(fileId);
    const retrievedContent = storedFile.toString();
    console.log("Retrieved content:", retrievedContent);

    if (retrievedContent !== fileContent) {
      throw new Error("Retrieved content doesn't match original content");
    }

    // 3. Test file deletion
    console.log("\n3. Testing file deletion...");
    await documentService.deleteDocument(document.id);

    // Verify deletion
    const deletedDoc = await documentService.getDocument(document.id);
    if (deletedDoc !== null) {
      throw new Error("Document was not deleted properly");
    }

    // Cleanup test file
    await fs.unlink(testFilePath);

    console.log("\nAll storage tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test
testStorage().catch(console.error);
