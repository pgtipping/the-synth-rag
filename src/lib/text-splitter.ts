import { encode } from "gpt-tokenizer";

export interface TextSplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  lengthFunction?: (text: string) => number;
  separators?: string[];
}

export interface TextChunk {
  text: string;
  index: number;
  tokens: number;
}

const defaultOptions: Required<TextSplitterOptions> = {
  chunkSize: 1000,
  chunkOverlap: 200,
  lengthFunction: (text: string) => encode(text).length,
  separators: ["\n\n", "\n", ". ", " ", ""],
};

export class TextSplitter {
  private options: Required<TextSplitterOptions>;

  constructor(options: TextSplitterOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Split text into chunks using semantic boundaries
   */
  splitText(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    let currentChunk = "";
    let currentLength = 0;
    let index = 0;

    // Clean and normalize text
    const cleanText = text.trim().replace(/\s+/g, " ");

    // Try each separator in order
    for (const separator of this.options.separators) {
      const segments = cleanText.split(separator).filter(Boolean);

      for (const segment of segments) {
        const segmentLength = this.options.lengthFunction(segment);

        // If adding this segment exceeds chunk size, save current chunk
        if (
          currentLength + segmentLength > this.options.chunkSize &&
          currentChunk
        ) {
          chunks.push({
            text: currentChunk.trim(),
            index,
            tokens: currentLength,
          });

          // Start new chunk with overlap from previous chunk
          if (this.options.chunkOverlap > 0) {
            const words = currentChunk.split(" ");
            const overlapWords = words.slice(
              -Math.floor(this.options.chunkOverlap / 10)
            );
            currentChunk = overlapWords.join(" ") + " " + segment;
            currentLength = this.options.lengthFunction(currentChunk);
          } else {
            currentChunk = segment;
            currentLength = segmentLength;
          }
          index++;
        } else {
          // Add segment to current chunk
          currentChunk = currentChunk
            ? `${currentChunk}${separator}${segment}`
            : segment;
          currentLength = this.options.lengthFunction(currentChunk);
        }
      }
    }

    // Add final chunk if not empty
    if (currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        index,
        tokens: currentLength,
      });
    }

    return chunks;
  }

  /**
   * Split text into chunks with a specific target size
   */
  splitBySize(text: string, targetSize: number): TextChunk[] {
    return new TextSplitter({
      ...this.options,
      chunkSize: targetSize,
    }).splitText(text);
  }

  /**
   * Split text by preserving semantic boundaries like paragraphs and sentences
   */
  splitBySemanticBoundaries(text: string): TextChunk[] {
    const customSeparators = [
      "\n\n\n", // Triple line breaks (major sections)
      "\n\n", // Double line breaks (paragraphs)
      "\n", // Single line breaks
      ". ", // Sentences
      ": ", // Colons
      "; ", // Semicolons
      ", ", // Commas
      " ", // Words
      "", // Characters
    ];

    return new TextSplitter({
      ...this.options,
      separators: customSeparators,
    }).splitText(text);
  }
}
