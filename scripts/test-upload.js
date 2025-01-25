import fs from "fs";
import FormData from "form-data";
import axios from "axios";

async function testUpload() {
  try {
    // Create form data
    const form = new FormData();
    form.append("file", fs.createReadStream("./test-file.pdf"));
    form.append("useCase", "test-case");

    // Make request
    const response = await axios.post(
      "http://localhost:3002/api/upload",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    console.log("Upload successful:", response.data);
  } catch (error) {
    console.error("Upload failed:", error.response?.data || error.message);
  }
}

testUpload().catch(console.error);
