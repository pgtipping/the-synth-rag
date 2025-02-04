import pool from "@/src/lib/db";

interface UploadRow {
  id: number;
}

export async function uploadFileToLocalStorage(
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<{ id: number; url: string }> {
  const client = await pool.connect();
  try {
    const result = await client.query<UploadRow>(
      `INSERT INTO uploads (filename, data, content_type) VALUES ($1, $2, $3) RETURNING id`,
      [fileName, buffer, contentType]
    );
    const id = result.rows[0].id;
    const url = `${
      process.env.LOCAL_FILE_BASE_URL || "http://localhost:3000"
    }/api/files/${id}`;
    return { id, url };
  } finally {
    client.release();
  }
}
