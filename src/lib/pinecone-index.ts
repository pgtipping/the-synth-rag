import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize embeddings model
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small",
});

// Get the index
const index = process.env.PINECONE_INDEX
  ? pinecone.index(process.env.PINECONE_INDEX)
  : null;

export interface IndexMetadata {
  documentId: number;
  chunkIndex: number;
  originalName?: string;
  mimeType?: string;
  processedAt?: string;
  text?: string;
  [key: string]: string | number | undefined;
}

export async function indexDocument(
  text: string,
  metadata: IndexMetadata
): Promise<string> {
  if (!index) {
    throw new Error("Pinecone index not configured");
  }

  try {
    console.log(`Starting to index document ${metadata.documentId}:`, {
      textLength: text.length,
      metadata,
    });

    // Generate embedding for the text chunk using embedDocuments
    console.log("Generating embeddings...");
    const [embedding] = await embeddings.embedDocuments([text]);
    console.log("Embeddings generated successfully");

    // Generate a unique vector ID
    const vectorId = `doc_${metadata.documentId}_chunk_${metadata.chunkIndex}`;
    console.log(`Generated vector ID: ${vectorId}`);

    // Upsert the vector
    console.log("Upserting vector to Pinecone...");
    await index.upsert([
      {
        id: vectorId,
        values: embedding,
        metadata: {
          ...metadata,
          text,
        },
      },
    ]);
    console.log("Vector upserted successfully");

    return vectorId;
  } catch (error) {
    console.error("Error indexing document:", error);
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    throw new Error(
      `Failed to index document chunk: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function deleteDocumentVectors(documentId: number): Promise<void> {
  if (!index) {
    throw new Error("Pinecone index not configured");
  }

  try {
    // Delete all vectors for the document
    await index.deleteMany({
      filter: {
        documentId: { $eq: documentId },
      },
    });
  } catch (error) {
    console.error("Error deleting document vectors:", error);
    throw new Error("Failed to delete document vectors");
  }
}

export interface SearchFilter {
  documentId?: number;
  mimeType?: string;
  [key: string]: string | number | undefined;
}

export interface SearchResult {
  score: number;
  metadata: IndexMetadata;
}

export async function searchSimilar(
  query: string,
  options: {
    topK?: number;
    filter?: SearchFilter;
  } = {}
): Promise<SearchResult[]> {
  if (!index) {
    throw new Error("Pinecone index not configured");
  }

  try {
    // Generate embedding for the query
    const embedding = await embeddings.embedQuery(query);

    // Search for similar vectors
    const results = await index.query({
      vector: embedding,
      topK: options.topK || 5,
      filter: options.filter,
      includeMetadata: true,
    });

    return results.matches.map((match) => ({
      score: match.score || 0,
      metadata: match.metadata as IndexMetadata,
    }));
  } catch (error) {
    console.error("Error searching similar documents:", error);
    throw new Error("Failed to search similar documents");
  }
}
