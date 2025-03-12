import { encode } from "gpt-tokenizer";

export interface TextChunk {
  text: string;
  tokens: number;
}

export interface TextSplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP = 50;
const DEFAULT_SEPARATORS = [
  "\n\n", // Double newline (strongest separator)
  "\n", // Single newline
  ". ", // Period with space
  "! ", // Exclamation with space
  "? ", // Question mark with space
  "; ", // Semicolon with space
  ": ", // Colon with space
  ", ", // Comma with space
  " ", // Single space (weakest separator)
];

export class TextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: TextSplitterOptions = {}) {
    this.chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
    this.chunkOverlap = options.chunkOverlap || DEFAULT_CHUNK_OVERLAP;
    this.separators = options.separators || DEFAULT_SEPARATORS;
  }

  /**
   * Splits text into chunks based on semantic boundaries while respecting token limits
   */
  public splitBySemanticBoundaries(text: string): TextChunk[] {
    // Initialize result array
    const chunks: TextChunk[] = [];

    // Helper function to get token count
    const getTokenCount = (text: string): number => encode(text).length;

    // Helper function to add a chunk if it meets minimum size
    const addChunk = (text: string, minTokens = 1) => {
      const trimmedText = text.trim();
      if (trimmedText) {
        const tokens = getTokenCount(trimmedText);
        if (tokens >= minTokens) {
          chunks.push({ text: trimmedText, tokens });
        }
      }
    };

    // Helper function to find the best split point
    const findBestSplitPoint = (text: string, maxLength: number): number => {
      let bestSplitPoint = -1;
      let bestTokenCount = 0;

      // Try each separator in order
      for (const separator of this.separators) {
        let searchStartIndex = text.length;

        while (searchStartIndex > 0) {
          const splitPoint = text.lastIndexOf(separator, searchStartIndex);
          if (splitPoint <= 0) break;

          const candidateChunk = text.slice(0, splitPoint + separator.length);
          const tokenCount = getTokenCount(candidateChunk);

          if (tokenCount <= maxLength && tokenCount > bestTokenCount) {
            bestSplitPoint = splitPoint + separator.length;
            bestTokenCount = tokenCount;
            break;
          }

          searchStartIndex = splitPoint - 1;
        }

        if (bestSplitPoint !== -1) break;
      }

      // If no good split point found, try splitting at word boundaries
      if (bestSplitPoint === -1) {
        const words = text.split(" ");
        let currentText = "";

        for (let i = 0; i < words.length; i++) {
          const nextText = (currentText ? currentText + " " : "") + words[i];
          const tokenCount = getTokenCount(nextText);

          if (tokenCount > maxLength) {
            if (currentText) {
              bestSplitPoint = currentText.length;
              break;
            }
          }
          currentText = nextText;
        }

        // If still no good split point, force split at maxLength
        if (bestSplitPoint === -1) {
          bestSplitPoint = Math.max(1, Math.floor(maxLength / 2));
        }
      }

      return bestSplitPoint;
    };

    // Process the text
    let remainingText = text.trim();
    let lastChunkText = "";

    while (remainingText) {
      const currentTokens = getTokenCount(remainingText);

      if (currentTokens <= this.chunkSize) {
        // Remaining text fits in a single chunk
        addChunk(remainingText);
        break;
      }

      // Find the best split point
      const splitPoint = findBestSplitPoint(remainingText, this.chunkSize);
      const chunk = remainingText.slice(0, splitPoint).trim();

      // Calculate minimum chunk size based on overlap
      const minChunkSize = Math.floor(this.chunkSize * 0.2); // At least 20% of chunk size

      // Add the chunk and prepare for next iteration
      addChunk(chunk, minChunkSize);
      remainingText = remainingText.slice(splitPoint).trim();

      // If we have overlap and there's more text, add overlap to the next chunk
      if (this.chunkOverlap > 0 && remainingText && lastChunkText) {
        // Find a good split point for overlap
        const overlapPoint = findBestSplitPoint(
          lastChunkText,
          this.chunkOverlap
        );
        if (overlapPoint > 0) {
          const overlapText = lastChunkText.slice(overlapPoint).trim();
          const overlapTokens = getTokenCount(overlapText);

          if (overlapTokens > 0 && overlapTokens <= this.chunkOverlap) {
            remainingText = overlapText + " " + remainingText;
          }
        }
      }

      lastChunkText = chunk;

      // Safety check: if we can't make progress, force a split
      if (remainingText === text) {
        const forcedChunk = remainingText.slice(
          0,
          Math.floor(this.chunkSize / 2)
        );
        addChunk(forcedChunk, minChunkSize);
        remainingText = remainingText
          .slice(Math.floor(this.chunkSize / 2))
          .trim();
      }
    }

    return chunks;
  }
}
