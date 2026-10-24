import postgres from 'postgres';

// Hindari multiple instances koneksi di Next.js development (Hot Module Reloading)
declare global {
  // eslint-disable-next-line no-var
  var __globalSql: postgres.Sql | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL tidak ditemukan di environment variables.');
}

export const sql =
  global.__globalSql ||
  postgres(connectionString || '', {
    ssl: 'require',
    max: 10, // batas pool koneksi untuk serverless / pooler
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Penting untuk Supabase transaction pooler (pgbouncer port 6543)
  });

if (process.env.NODE_ENV !== 'production') {
  global.__globalSql = sql;
}

export default sql;
