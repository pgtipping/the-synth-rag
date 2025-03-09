-- Add use_case column to documents table
ALTER TABLE documents
ADD COLUMN use_case TEXT NOT NULL DEFAULT 'general';

-- Create an index on use_case for faster filtering
CREATE INDEX idx_documents_use_case ON documents(use_case);

-- Add a check constraint to ensure use_case is one of the allowed values
ALTER TABLE documents
ADD CONSTRAINT valid_use_case CHECK (
    use_case IN (
        'general',
        'sales_assistant',
        'onboarding_assistant',
        'knowledge_hub'
        -- Add more use cases as needed
    )
);
