import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const index = pinecone.index(process.env.PINECONE_INDEX!);

    // Get index statistics
    const stats = await index.describeIndexStats();

    console.log("✅ Pinecone connection successful");
    console.log("Index Stats:", {
      dimension: stats.dimension,
      totalRecords: stats.totalRecordCount,
      namespaces: Object.keys(stats.namespaces ?? {}),
    });
  } catch (error) {
    console.error("❌ Pinecone connection failed:");
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
    }
    process.exit(1);
  }
}

main();
