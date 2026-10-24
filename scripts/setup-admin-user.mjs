/**
 * @file scripts/setup-admin-user.mjs
 * @description Script untuk inisialisasi tabel admin_users di Supabase dan membuat/mereset
 * akun administrator dengan hashing password bcrypt.
 *
 * Cara menjalankan:
 *   node --env-file=.env scripts/setup-admin-user.mjs
 */

import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL tidak ditemukan di file .env');
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: 'require',
  prepare: false, // Wajib untuk Supabase transaction pooler port 6543
});

async function main() {
  console.log('🚀 Menghubungi Supabase PostgreSQL...');

  // 1. Buat tabel admin_users jika belum ada
  console.log('📦 Memeriksa / membuat tabel admin_users...');
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT DEFAULT 'Administrator SiagaNusa',
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );
  `;

  // Buat index pada kolom username
  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users (username);
  `;
  console.log('✅ Tabel admin_users dan index siap.');

  // 2. Kredensial default
  const defaultUsername = 'siaganusa';
  const defaultPassword = 'siaga_nusaid';
  const saltRounds = 10;

  console.log(`🔒 Membuat hash bcrypt untuk username: "${defaultUsername}"...`);
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  // 3. Simpan atau perbarui akun admin (UPSERT)
  const [admin] = await sql`
    INSERT INTO admin_users (
      username,
      password_hash,
      name,
      role,
      updated_at
    ) VALUES (
      ${defaultUsername},
      ${passwordHash},
      'Admin SiagaNusa',
      'admin',
      NOW()
    )
    ON CONFLICT (username)
    DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      updated_at = NOW()
    RETURNING id, username, name, role, created_at, updated_at;
  `;

  console.log('🎉 Administrator berhasil disimpan ke database:');
  console.log({
    id: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
    created_at: admin.created_at,
    updated_at: admin.updated_at,
  });

  await sql.end();
  console.log('✨ Selesai.');
}

main().catch(async (err) => {
  console.error('❌ Gagal menginisialisasi admin user:', err);
  await sql.end();
  process.exit(1);
});
