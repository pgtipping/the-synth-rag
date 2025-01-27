import { Readable } from "stream";
import { ReadableStream } from "stream/web";
export function convertWebToNodeStream(webStream) {
    // Create a type-safe wrapper that properly handles the conversion
    const stream = new ReadableStream({
        async start(controller) {
            const reader = webStream.getReader();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    controller.enqueue(value);
                }
                controller.close();
            }
            catch (error) {
                controller.error(error);
            }
            finally {
                reader.releaseLock();
            }
        },
    });
    return Readable.fromWeb(stream, {
        objectMode: false,
        encoding: "binary",
        highWaterMark: 1024 * 1024, // 1MB buffer size
    });
}
