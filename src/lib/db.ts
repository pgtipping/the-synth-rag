import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool(); // Will automatically use PG* environment variables

export default pool;
