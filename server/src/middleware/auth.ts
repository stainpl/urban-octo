// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { JwtPayload } from 'jsonwebtoken';

export type AuthUser = { id: string; role?: string; email?: string };

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing access token' });

    const token = auth.split(' ')[1];
    const decoded = verifyAccessToken(token) as string | JwtPayload;

    // prefer JwtPayload shape
    const payload = (typeof decoded === 'object' && decoded !== null) ? decoded as JwtPayload : null;
    if (!payload || (!payload.sub)) return res.status(401).json({ error: 'Invalid token' });

    // attach user info to req - keep typing loose here
    (req as any).user = { id: String(payload.sub), role: String(payload.role || '') } as AuthUser;

    return next();
  } catch (err) {
    console.error('requireAuth error', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** requireRole('admin') */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (!user.role || user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}