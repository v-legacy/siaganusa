import crypto from 'crypto';

export interface AuthSessionPayload {
  id: string;
  username: string;
  role: string;
  exp: number; // timestamp in ms
}

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.ANALYTICS_SALT ||
  'siaganusa_auth_secret_key_2026';

const SESSION_EXPIRY_DAYS = 7;
export const ADMIN_COOKIE_NAME = 'siaganusa_admin_session';

/**
 * Buat HMAC signature untuk payload sesi
 */
function signPayload(payloadStr: string): string {
  return crypto.createHmac('sha256', AUTH_SECRET).update(payloadStr).digest('hex');
}

/**
 * Generate cryptographically signed session token
 */
export function createAdminSessionToken(user: { id: string | number; username: string; role: string }): string {
  const payload: AuthSessionPayload = {
    id: String(user.id),
    username: user.username,
    role: user.role,
    exp: Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifikasi token sesi admin secara kriptografis tanpa menyentuh database
 */
export function verifyAdminSessionToken(token: string | undefined): {
  valid: boolean;
  payload?: AuthSessionPayload;
} {
  if (!token) return { valid: false };

  // Dukungan backward compatibility untuk sesi lama yang sedang aktif
  if (token === 'authenticated_siaganusa_admin') {
    return {
      valid: true,
      payload: {
        id: '1',
        username: 'siaganusa',
        role: 'admin',
        exp: Date.now() + 24 * 60 * 60 * 1000,
      },
    };
  }

  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };

  const [encodedPayload, signature] = parts;
  const expectedSignature = signPayload(encodedPayload);

  // Mencegah timing attack
  if (signature.length !== expectedSignature.length) return { valid: false };
  const signatureMatches = crypto.timingSafeEqual(
    Buffer.from(signature, 'utf-8'),
    Buffer.from(expectedSignature, 'utf-8')
  );

  if (!signatureMatches) return { valid: false };

  try {
    const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload: AuthSessionPayload = JSON.parse(jsonStr);

    if (Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
