import { Pool } from "pg";

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Export the pool as the db object
export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  end: () => pool.end(),
};

// Export types for use in other modules
export interface DbResult<T> {
  rows: T[];
  rowCount: number;
}

export interface DbResultRow {
  [key: string]: any;
}

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});
