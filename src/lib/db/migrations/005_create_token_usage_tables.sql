-- Create token usage table
CREATE TABLE IF NOT EXISTS token_usage (
  id SERIAL PRIMARY KEY,
  request_id UUID NOT NULL,
  session_id UUID,
  user_id VARCHAR(255),
  model VARCHAR(255) NOT NULL,
  feature VARCHAR(255) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost_usd DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create index on token_usage table
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_model ON token_usage(model);
CREATE INDEX IF NOT EXISTS idx_token_usage_feature ON token_usage(feature);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_request_id ON token_usage(request_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_session_id ON token_usage(session_id);

-- Create token usage summary table for aggregated metrics
CREATE TABLE IF NOT EXISTS token_usage_summary (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  model VARCHAR(255),
  feature VARCHAR(255),
  user_id VARCHAR(255),
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(date, model, feature, user_id)
);

-- Create index on token_usage_summary table
CREATE INDEX IF NOT EXISTS idx_token_usage_summary_date ON token_usage_summary(date);
CREATE INDEX IF NOT EXISTS idx_token_usage_summary_model ON token_usage_summary(model);
CREATE INDEX IF NOT EXISTS idx_token_usage_summary_feature ON token_usage_summary(feature);
CREATE INDEX IF NOT EXISTS idx_token_usage_summary_user_id ON token_usage_summary(user_id);

-- Create user token quota table
CREATE TABLE IF NOT EXISTS user_token_quota (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  daily_limit INTEGER,
  monthly_limit INTEGER,
  current_daily_usage INTEGER NOT NULL DEFAULT 0,
  current_monthly_usage INTEGER NOT NULL DEFAULT 0,
  daily_reset_at TIMESTAMP WITH TIME ZONE,
  monthly_reset_at TIMESTAMP WITH TIME ZONE,
  is_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_token_quota table
CREATE INDEX IF NOT EXISTS idx_user_token_quota_user_id ON user_token_quota(user_id);

-- Create function to update token usage summary
CREATE OR REPLACE FUNCTION update_token_usage_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO token_usage_summary (
    date, 
    model, 
    feature, 
    user_id, 
    input_tokens, 
    output_tokens, 
    total_tokens, 
    estimated_cost_usd, 
    request_count
  ) VALUES (
    DATE(NEW.created_at),
    NEW.model,
    NEW.feature,
    NEW.user_id,
    NEW.input_tokens,
    NEW.output_tokens,
    NEW.total_tokens,
    NEW.estimated_cost_usd,
    1
  )
  ON CONFLICT (date, model, feature, user_id)
  DO UPDATE SET
    input_tokens = token_usage_summary.input_tokens + NEW.input_tokens,
    output_tokens = token_usage_summary.output_tokens + NEW.output_tokens,
    total_tokens = token_usage_summary.total_tokens + NEW.total_tokens,
    estimated_cost_usd = token_usage_summary.estimated_cost_usd + NEW.estimated_cost_usd,
    request_count = token_usage_summary.request_count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update token usage summary
DROP TRIGGER IF EXISTS trigger_update_token_usage_summary ON token_usage;
CREATE TRIGGER trigger_update_token_usage_summary
AFTER INSERT ON token_usage
FOR EACH ROW
EXECUTE FUNCTION update_token_usage_summary(); 