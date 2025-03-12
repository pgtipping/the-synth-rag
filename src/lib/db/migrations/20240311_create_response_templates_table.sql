-- Create response_templates table
CREATE TABLE IF NOT EXISTS response_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    template TEXT NOT NULL,
    use_case VARCHAR(50) NOT NULL,
    max_tokens INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on name
CREATE UNIQUE INDEX IF NOT EXISTS idx_response_templates_name ON response_templates (name);

-- Create index for use case lookups
CREATE INDEX IF NOT EXISTS idx_response_templates_use_case ON response_templates (use_case);

-- Create index for active templates
CREATE INDEX IF NOT EXISTS idx_response_templates_active ON response_templates (is_active);

-- Insert default templates
INSERT INTO response_templates (name, template, use_case, max_tokens, description)
VALUES 
    (
        'concise_answer',
        'Here''s a brief answer:\n\n{content}\n\nKey sources: {citations}',
        'general',
        300,
        'A concise response format for general questions'
    ),
    (
        'detailed_explanation',
        'Here''s a detailed explanation:\n\n{content}\n\nSources:\n{citations}',
        'technical',
        1000,
        'A detailed response format for technical questions'
    ),
    (
        'step_by_step',
        'Follow these steps:\n\n{content}\n\nReferences:\n{citations}',
        'tutorial',
        800,
        'A step-by-step format for tutorials and instructions'
    )
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_response_templates_updated_at
    BEFORE UPDATE ON response_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 