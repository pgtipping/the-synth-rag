-- Create prompt categories table
CREATE TABLE IF NOT EXISTS prompt_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create example prompts table
CREATE TABLE IF NOT EXISTS example_prompts (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES prompt_categories(id) ON DELETE CASCADE,
  use_case VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create prompt usage stats table
CREATE TABLE IF NOT EXISTS prompt_usage_stats (
  prompt_id INTEGER PRIMARY KEY REFERENCES example_prompts(id) ON DELETE CASCADE,
  total_uses INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for category_id
CREATE INDEX IF NOT EXISTS idx_example_prompts_category_id ON example_prompts(category_id);

-- Create index for use_case
CREATE INDEX IF NOT EXISTS idx_example_prompts_use_case ON example_prompts(use_case);

-- Create index for display_order
CREATE INDEX IF NOT EXISTS idx_example_prompts_display_order ON example_prompts(display_order);

-- Create index for is_active
CREATE INDEX IF NOT EXISTS idx_example_prompts_is_active ON example_prompts(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_prompt_categories_updated_at
  BEFORE UPDATE ON prompt_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_example_prompts_updated_at
  BEFORE UPDATE ON example_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_usage_stats_updated_at
  BEFORE UPDATE ON prompt_usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 