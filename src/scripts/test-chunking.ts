import { TextSplitter } from "../lib/text-splitter";

const testChunking = async () => {
  // Create a text splitter with smaller chunk size
  const splitter = new TextSplitter({
    chunkSize: 50,
    chunkOverlap: 10,
  });

  // Test case 1: Simple paragraphs
  console.log("\n=== Test Case 1: Simple Paragraphs ===");
  const text1 = `First paragraph with some content.

Second paragraph that contains multiple sentences. This is another sentence in the same paragraph. And here's one more.

Third paragraph that's relatively short.`;

  const chunks1 = splitter.splitBySemanticBoundaries(text1);
  console.log(`Created ${chunks1.length} chunks:`);
  chunks1.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1} (${chunk.tokens} tokens):`);
    console.log(chunk.text);
  });

  // Test case 2: Long technical content
  console.log("\n=== Test Case 2: Technical Content ===");
  const text2 = `# Introduction to RAG Systems

Retrieval-Augmented Generation (RAG) is a technique that combines information retrieval with text generation to produce more accurate and contextually relevant responses.

## Key Components

1. Document Processing: The system processes and indexes documents for efficient retrieval.
2. Vector Storage: Document chunks are converted to vectors and stored in a vector database.
3. Similarity Search: When a query is received, the system finds relevant document chunks.
4. Context Integration: Retrieved chunks are combined with the query for the language model.

## Benefits

- Improved accuracy through grounding in source documents
- Reduced hallucinations by providing factual context
- Better transparency with source attribution
- Enhanced control over model outputs`;

  const chunks2 = splitter.splitBySemanticBoundaries(text2);
  console.log(`\nCreated ${chunks2.length} chunks:`);
  chunks2.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1} (${chunk.tokens} tokens):`);
    console.log(chunk.text);
  });

  // Test case 3: Content with various separators
  console.log("\n=== Test Case 3: Mixed Separators ===");
  const text3 = `Title: Understanding Text Chunking
Subtitle: A Technical Overview;
Author: System Engineer

Key Points:
1. Chunk Size: Optimal size depends on model context window
2. Overlap: Ensures context continuity between chunks
3. Boundaries: Respect natural text boundaries for better coherence

Common Separators: newlines, periods, semicolons, and commas are all important.

Technical Details:
- Implementation uses recursive splitting
- Configurable separators list
- Token counting for size control`;

  const chunks3 = splitter.splitBySemanticBoundaries(text3);
  console.log(`\nCreated ${chunks3.length} chunks:`);
  chunks3.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1} (${chunk.tokens} tokens):`);
    console.log(chunk.text);
  });

  // Test case 4: Edge case with very long sentence
  console.log("\n=== Test Case 4: Long Sentence ===");
  const text4 =
    "This is a very long sentence that contains many words and should be split into multiple chunks because it exceeds the maximum chunk size and we want to test how the splitter handles such cases where a single sentence is longer than the desired chunk size and needs to be broken up into smaller pieces while still maintaining as much coherence as possible and ensuring that the meaning is preserved across the chunk boundaries even though it's not ideal to split in the middle of a sentence but sometimes it's necessary to handle such edge cases properly.";

  const chunks4 = splitter.splitBySemanticBoundaries(text4);
  console.log(`\nCreated ${chunks4.length} chunks:`);
  chunks4.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1} (${chunk.tokens} tokens):`);
    console.log(chunk.text);
  });

  // Test case 5: Small chunks with overlap
  console.log("\n=== Test Case 5: Small Chunks with Overlap ===");
  const smallSplitter = new TextSplitter({
    chunkSize: 15,
    chunkOverlap: 5,
  });

  const text5 =
    "First sentence about a specific topic. Second sentence continuing the discussion. Third sentence adding more details. Fourth sentence wrapping up the point. Fifth sentence starting a new topic.";

  const chunks5 = smallSplitter.splitBySemanticBoundaries(text5);
  console.log(`\nCreated ${chunks5.length} chunks:`);
  chunks5.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1} (${chunk.tokens} tokens):`);
    console.log(chunk.text);
  });
};

// Run the tests
testChunking().catch(console.error);
