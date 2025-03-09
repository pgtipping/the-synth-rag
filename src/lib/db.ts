import { Pool } from "pg";

// Create a pool based on environment
const pool = new Pool({
  // Use environment variables or default values
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  // Disable SSL for local development
  ssl: false
});

export default pool;
