import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Pool } = pg;
const POSTGRES_URL = process.env.POSTGRES_URL;

const connection = new Pool({
    connectionString: POSTGRES_URL
});

await connection.connect();

export default connection;