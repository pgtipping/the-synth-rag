import type OpenAI from "openai";

export function OpenAIStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          // Check if chunk and choices exist
          if (!chunk || !chunk.choices || chunk.choices.length === 0) {
            continue;
          }

          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          }
        }
        controller.close();
      } catch (error) {
        console.error("Error in OpenAI stream:", error);
        controller.error(error);
      }
    },
  });
}
