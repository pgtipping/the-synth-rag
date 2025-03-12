-- Create token_usage table
CREATE TABLE IF NOT EXISTS token_usage (
    id SERIAL PRIMARY KEY,
    model VARCHAR(50) NOT NULL,
    feature VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    estimated_cost_usd DECIMAL(10, 6) NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_token_usage_timestamp ON token_usage (timestamp);
CREATE INDEX IF NOT EXISTS idx_token_usage_model ON token_usage (model);
CREATE INDEX IF NOT EXISTS idx_token_usage_feature ON token_usage (feature);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage (user_id);

-- Create view for daily aggregates
CREATE OR REPLACE VIEW token_usage_daily AS
SELECT 
    DATE(timestamp) as date,
    model,
    feature,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(estimated_cost_usd) as total_cost_usd,
    COUNT(*) as request_count
FROM token_usage
GROUP BY DATE(timestamp), model, feature;

-- Create view for user aggregates
CREATE OR REPLACE VIEW token_usage_by_user AS
SELECT 
    user_id,
    model,
    feature,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(estimated_cost_usd) as total_cost_usd,
    COUNT(*) as request_count
FROM token_usage
GROUP BY user_id, model, feature; 