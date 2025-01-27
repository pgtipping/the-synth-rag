import crypto from "crypto";

// Generate a secure encryption key
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Encrypt file data using AES-256-GCM
export const encryptFile = (
  data: Buffer,
  key: string
): { encrypted: Buffer; iv: string; authTag: string } => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    iv
  );
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
};

// Decrypt file data
export const decryptFile = (
  encrypted: Buffer,
  key: string,
  iv: string,
  authTag: string
): Buffer => {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};
