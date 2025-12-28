// Creates a shared PostgreSQL connection pool for the whole backend.
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// DATABASE_URL example:
// postgres://username:password@localhost:5432/db_name
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Database connection error:", err));

export default pool;
