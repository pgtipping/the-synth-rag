// Simple implementation that doesn't rely on OpenAI SDK types
export function OpenAIStream(stream: unknown): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Type guards
  function isReadableStream(value: unknown): value is ReadableStream {
    return (
      value !== null &&
      typeof value === "object" &&
      "getReader" in value &&
      typeof (value as Record<string, unknown>).getReader === "function"
    );
  }

  function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
    return (
      value !== null &&
      typeof value === "object" &&
      Symbol.asyncIterator in value
    );
  }

  return new ReadableStream({
    async start(controller) {
      try {
        // If stream is a ReadableStream (from fetch)
        if (isReadableStream(stream)) {
          const reader = stream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            // Process SSE format
            const lines = chunk
              .split("\n")
              .filter((line) => line.trim() !== "")
              .filter((line) => line.startsWith("data: "));

            for (const line of lines) {
              if (line.includes("[DONE]")) continue;

              try {
                const json = JSON.parse(line.replace("data: ", ""));
                const text = json.choices?.[0]?.delta?.content || "";
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              } catch (e) {
                console.error("Error parsing SSE line:", e);
              }
            }
          }
        }
        // If stream is an AsyncIterable (from OpenAI SDK)
        else if (isAsyncIterable(stream)) {
          for await (const chunk of stream) {
            // Type guard for chunk
            if (!chunk || typeof chunk !== "object") continue;

            // Check if chunk has choices property
            const chunkObj = chunk as Record<string, unknown>;
            if (
              !("choices" in chunkObj) ||
              !Array.isArray(chunkObj.choices) ||
              chunkObj.choices.length === 0
            ) {
              continue;
            }

            // Extract content from delta
            const firstChoice = chunkObj.choices[0] as
              | Record<string, unknown>
              | undefined;
            if (!firstChoice || !("delta" in firstChoice)) continue;

            const delta = firstChoice.delta as
              | Record<string, unknown>
              | undefined;
            if (!delta || !("content" in delta)) continue;

            const text = delta.content as string;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        }
        // If it's just a string
        else if (typeof stream === "string") {
          controller.enqueue(encoder.encode(stream));
        } else {
          console.warn("Unknown stream type:", typeof stream);
          controller.enqueue(
            encoder.encode("Error: Unable to process response")
          );
        }

        controller.close();
      } catch (error) {
        console.error("Error in OpenAI stream:", error);
        controller.error(error);
      }
    },
  });
}
