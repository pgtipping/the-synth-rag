import { ReadableStream } from "stream/web";
import { convertWebToNodeStream } from "../dist/lib/stream-utils.js";

const webStream = new ReadableStream({
  start(controller) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode("Test data chunk 1\n"));
    controller.enqueue(encoder.encode("Test data chunk 2\n"));
    controller.close();
  },
});

try {
  const nodeStream = convertWebToNodeStream(webStream);
  let receivedData = "";

  for await (const chunk of nodeStream) {
    receivedData += chunk.toString();
  }

  const expectedOutput = "Test data chunk 1\nTest data chunk 2\n";
  if (receivedData === expectedOutput) {
    console.log("✅ Stream conversion test passed");
  } else {
    console.error("❌ Stream conversion test failed");
    console.log("Expected:", expectedOutput);
    console.log("Received:", receivedData);
  }
} catch (error) {
  console.error("❌ Stream conversion test failed with error:", error);
  process.exit(1);
}
