import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';

// Stop early if secret is not available 
if (!process.env.ACCESS_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET environment variable is required');
}
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

const REFRESH_TOKEN_BYTES = 48; 

export function signAccessToken(payload: { sub: string; role: string }): string {
  return jwt.sign(
    { sub: payload.sub, role: payload.role }, 
    ACCESS_SECRET, 
    { expiresIn: ACCESS_EXPIRES as any }
  );
}

/**
 * verifyAccessToken
 * - returns the decoded payload (string | object). Caller should handle errors.
 */
export function verifyAccessToken(token: string): string | jwt.JwtPayload {
  // jwt.verify can throw; let caller catch (or wrap here if you prefer)
  return jwt.verify(token, ACCESS_SECRET);
}

// generate opaque refresh token (plaintext returned to client)
export function genRefreshTokenPlain(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

// hash a token (for storing in DB)
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
