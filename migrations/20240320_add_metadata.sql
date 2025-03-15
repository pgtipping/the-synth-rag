-- Add metadata column to document_chunks table
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Create an index on metadata for performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata ON document_chunks USING GIN (metadata);

-- Update existing rows to have empty metadata
UPDATE document_chunks SET metadata = '{}'::jsonb WHERE metadata IS NULL; 