import { TextSplitter } from "./text-splitter";

describe("TextSplitter", () => {
  let splitter: TextSplitter;

  beforeEach(() => {
    splitter = new TextSplitter({
      chunkSize: 100,
      chunkOverlap: 20,
    });
  });

  describe("splitText", () => {
    it("should split text into chunks respecting size limits", () => {
      const text =
        "This is a test document. It has multiple sentences. " +
        "We want to make sure it splits correctly. Here is some more text to split.";

      const chunks = splitter.splitText(text);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.tokens).toBeLessThanOrEqual(100);
        expect(chunk.text.length).toBeGreaterThan(0);
      });
    });

    it("should handle empty text", () => {
      const chunks = splitter.splitText("");
      expect(chunks).toHaveLength(0);
    });

    it("should handle text smaller than chunk size", () => {
      const text = "Small text";
      const chunks = splitter.splitText(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toBe(text);
    });
  });

  describe("splitBySemanticBoundaries", () => {
    it("should split text respecting semantic boundaries", () => {
      const text =
        "First paragraph.\n\n" +
        "Second paragraph with multiple sentences. Another sentence here.\n\n" +
        "Third paragraph.";

      const chunks = splitter.splitBySemanticBoundaries(text);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].text).toBe("First paragraph.");
    });

    it("should handle text with various separators", () => {
      const text = "Title: Subtitle; Content, more content: final part.";
      const chunks = splitter.splitBySemanticBoundaries(text);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.tokens).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("chunk overlap", () => {
    it("should maintain specified overlap between chunks", () => {
      const splitterWithOverlap = new TextSplitter({
        chunkSize: 50,
        chunkOverlap: 20,
      });

      const text =
        "This is the first chunk of text. " +
        "This should be in the second chunk with some overlap.";

      const chunks = splitterWithOverlap.splitText(text);

      expect(chunks.length).toBeGreaterThan(1);
      const firstChunkWords = chunks[0].text.split(" ");
      const secondChunkWords = chunks[1].text.split(" ");

      // Check if some words from the end of first chunk appear at start of second chunk
      const overlap = firstChunkWords
        .slice(-2)
        .some((word) => secondChunkWords.slice(0, 2).includes(word));

      expect(overlap).toBe(true);
    });
  });
});
