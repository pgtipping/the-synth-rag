import convertWebToNodeStream from "../src/lib/stream-utils.js";
import { ReadableStream } from "stream/web";

async function testStreamConversion() {
  try {
    // Create a test Web Stream with proper typing
    const webStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode("Test data chunk 1\n"));
        controller.enqueue(encoder.encode("Test data chunk 2\n"));
        controller.close();
      },
    });

    // Convert to Node Stream
    const nodeStream = convertWebToNodeStream(webStream);

    // Verify the conversion
    let receivedData = "";
    for await (const chunk of nodeStream) {
      receivedData += chunk.toString();
    }

    // Validate results
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
  }
}

testStreamConversion();
