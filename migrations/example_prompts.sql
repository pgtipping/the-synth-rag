-- Example Prompts System Migration

-- Prompt categories table
CREATE TABLE IF NOT EXISTS prompt_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Example prompts table
CREATE TABLE IF NOT EXISTS example_prompts (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES prompt_categories(id) ON DELETE CASCADE,
    use_case TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Prompt usage analytics table
CREATE TABLE IF NOT EXISTS prompt_usage (
    id SERIAL PRIMARY KEY,
    prompt_id INTEGER NOT NULL REFERENCES example_prompts(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    success_rating INTEGER CHECK (success_rating BETWEEN 1 AND 5),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_example_prompts_category_id ON example_prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_example_prompts_use_case ON example_prompts(use_case);
CREATE INDEX IF NOT EXISTS idx_example_prompts_is_active ON example_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_example_prompts_display_order ON example_prompts(display_order);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt_id ON prompt_usage(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_session_id ON prompt_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_used_at ON prompt_usage(used_at);

-- Triggers to update updated_at
CREATE TRIGGER update_prompt_categories_updated_at
    BEFORE UPDATE ON prompt_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_example_prompts_updated_at
    BEFORE UPDATE ON example_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial categories
INSERT INTO prompt_categories (name, description) VALUES
    ('General', 'General-purpose example prompts'),
    ('Sales', 'Sales-related example prompts'),
    ('Support', 'Customer support example prompts'),
    ('Technical', 'Technical documentation prompts'),
    ('Onboarding', 'User onboarding prompts')
ON CONFLICT (name) DO NOTHING;

-- Insert some initial example prompts
INSERT INTO example_prompts (category_id, use_case, title, content, description, display_order) VALUES
    ((SELECT id FROM prompt_categories WHERE name = 'Sales'), 
     'sales_assistant',
     'Product Feature Analysis',
     'Analyze the key features and benefits of [Product Name] compared to our competitors.',
     'Helps sales teams understand product differentiation',
     1),
    ((SELECT id FROM prompt_categories WHERE name = 'Support'),
     'support_assistant',
     'Troubleshooting Guide',
     'What are the steps to resolve [Issue] in [Product]?',
     'Helps support teams provide step-by-step solutions',
     1),
    ((SELECT id FROM prompt_categories WHERE name = 'Onboarding'),
     'onboarding_assistant',
     'Getting Started',
     'What are the first steps I should take to set up [Product]?',
     'Helps new users get started with the product',
     1)
ON CONFLICT DO NOTHING; 