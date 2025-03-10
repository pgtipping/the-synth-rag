-- Migration: Add use_case column to documents table
-- Date: March 10, 2025

-- Add use_case column to documents table
ALTER TABLE documents
ADD COLUMN use_case VARCHAR(50) NOT NULL DEFAULT 'general';

-- Create index on use_case column for faster filtering
CREATE INDEX idx_documents_use_case ON documents(use_case);

-- Update existing documents to have appropriate use cases based on their content or purpose
-- This is a placeholder - in a real migration, you might want to set specific use cases
-- based on document content analysis or other criteria 