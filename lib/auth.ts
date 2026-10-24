import bcrypt from 'bcryptjs';
import sql from './db';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}

export * from './auth-session';

/**
 * Verifikasi kredensial login admin terhadap database Supabase menggunakan bcrypt
 */
export async function verifyAdminCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<{
  success: boolean;
  message?: string;
  user?: AdminUser;
}> {
  const trimmedUsername = (usernameInput || '').trim();
  const password = passwordInput || '';

  if (!trimmedUsername || !password) {
    return { success: false, message: 'Username dan password wajib diisi!' };
  }

  try {
    // Ambil data admin dari Supabase
    const rows = await sql`
      SELECT
        id::text,
        username,
        password_hash,
        name,
        role,
        created_at,
        last_login_at
      FROM admin_users
      WHERE username = ${trimmedUsername}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return { success: false, message: 'Username atau password tidak valid!' };
    }

    const row = rows[0];
    const passwordHash = String(row.password_hash || '');

    // Verifikasi password dengan bcrypt
    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      return { success: false, message: 'Username atau password tidak valid!' };
    }

    // Update waktu login terakhir
    await sql`
      UPDATE admin_users
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = ${row.id};
    `;

    const user: AdminUser = {
      id: String(row.id),
      username: String(row.username),
      name: String(row.name || 'Administrator'),
      role: String(row.role || 'admin'),
      createdAt: new Date(String(row.created_at)).toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    return { success: true, user };
  } catch (error) {
    console.error('Error saat verifikasi kredensial admin di Supabase:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan sistem saat menghubungi database authentication.',
    };
  }
}

/**
 * Utility untuk membuat hash bcrypt (misal jika ingin reset atau tambah admin baru)
 */
export async function hashPassword(plainText: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plainText, saltRounds);
}
