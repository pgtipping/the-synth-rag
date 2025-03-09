-- Drop triggers
DROP TRIGGER IF EXISTS update_prompt_usage_stats_updated_at ON prompt_usage_stats;
DROP TRIGGER IF EXISTS update_example_prompts_updated_at ON example_prompts;
DROP TRIGGER IF EXISTS update_prompt_categories_updated_at ON prompt_categories;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_example_prompts_is_active;
DROP INDEX IF EXISTS idx_example_prompts_display_order;
DROP INDEX IF EXISTS idx_example_prompts_use_case;
DROP INDEX IF EXISTS idx_example_prompts_category_id;

-- Drop tables
DROP TABLE IF EXISTS prompt_usage_stats;
DROP TABLE IF EXISTS example_prompts;
DROP TABLE IF EXISTS prompt_categories; 