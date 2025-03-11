import { sql } from "@vercel/postgres";

export async function createProgressTables() {
  // Create progress_sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS progress_sessions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255), -- Optional, for future auth integration
      session_id VARCHAR(255) NOT NULL,
      use_case VARCHAR(100) NOT NULL,
      start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) DEFAULT 'active',
      completion_percentage INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create progress_steps table
    CREATE TABLE IF NOT EXISTS progress_steps (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES progress_sessions(id) ON DELETE CASCADE,
      step_type VARCHAR(100) NOT NULL,
      step_name VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      start_time TIMESTAMP WITH TIME ZONE,
      end_time TIMESTAMP WITH TIME ZONE,
      completion_percentage INTEGER DEFAULT 0,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create progress_metrics table
    CREATE TABLE IF NOT EXISTS progress_metrics (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES progress_sessions(id) ON DELETE CASCADE,
      metric_name VARCHAR(100) NOT NULL,
      metric_value NUMERIC NOT NULL,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_progress_sessions_session_id ON progress_sessions(session_id);
    CREATE INDEX IF NOT EXISTS idx_progress_sessions_use_case ON progress_sessions(use_case);
    CREATE INDEX IF NOT EXISTS idx_progress_steps_session_id ON progress_steps(session_id);
    CREATE INDEX IF NOT EXISTS idx_progress_steps_status ON progress_steps(status);
    CREATE INDEX IF NOT EXISTS idx_progress_metrics_session_id ON progress_metrics(session_id);

    -- Create updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create triggers for updated_at
    CREATE TRIGGER update_progress_sessions_updated_at
      BEFORE UPDATE ON progress_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_progress_steps_updated_at
      BEFORE UPDATE ON progress_steps
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;
}

export async function dropProgressTables() {
  await sql`
    DROP TABLE IF EXISTS progress_metrics;
    DROP TABLE IF EXISTS progress_steps;
    DROP TABLE IF EXISTS progress_sessions;
    DROP FUNCTION IF EXISTS update_updated_at_column();
  `;
}
