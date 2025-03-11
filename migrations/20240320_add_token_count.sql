-- Add token_count column to document_chunks table
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS token_count INTEGER NOT NULL DEFAULT 0;

-- Create an index on token_count for performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_token_count ON document_chunks(token_count);

-- Update existing rows to calculate token count (this is a placeholder, actual token counting would need to be done in application code)
UPDATE document_chunks SET token_count = length(text_content) / 4 WHERE token_count = 0; 