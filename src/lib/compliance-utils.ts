export const scrubPII = (text: string): string => {
  // Regex patterns for common PII formats
  const patterns = [
    /\\b\\d{3}-\\d{2}-\\d{4}\\b/g, // SSN
    /\\b\\d{3}-\\d{3}-\\d{4}\\b/g, // Phone
    /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g, // Email
    /\\b\\d{16}\\b/g, // Credit Card
    /\\b\\d{4}[ -]?\\d{4}[ -]?\\d{4}[ -]?\\d{4}\\b/g, // IBAN-like
  ];

  return patterns.reduce(
    (scrubbed, pattern) => scrubbed.replace(pattern, "[REDACTED]"),
    text
  );
};

import { addJob } from "./queue";
import { deleteFile } from "./file-processor";
import { logger } from "./utils";

export const scheduleFileDeletion = async (
  fileId: string,
  expiresAt: string
): Promise<void> => {
  try {
    const deletionTime = new Date(expiresAt).getTime() - Date.now();

    if (deletionTime <= 0) {
      await deleteFile(fileId);
      return;
    }

    await addJob({
      type: "delete-file",
      payload: { fileId },
      delay: deletionTime,
    });

    logger.info(`Scheduled deletion of ${fileId} at ${expiresAt}`);
  } catch (error) {
    logger.error(`Failed to schedule deletion for ${fileId}: ${error}`);
    throw error;
  }
};
