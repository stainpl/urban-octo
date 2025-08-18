import { Request, Response } from 'express';
import User from '../models/User';
import { signAccessToken, genRefreshTokenPlain, hashToken } from '../utils/jwt';

const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'jid';
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_EXPIRES_DAYS || 30);

function setRefreshCookie(res: Response, plain: string, days = REFRESH_EXPIRES_DAYS) {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, plain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: days * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    // issue access token
    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });

    // create & store refresh token (hashed)
    const refreshPlain = genRefreshTokenPlain();
    const refreshHash = hashToken(refreshPlain);
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    // remove expired tokens, push new one
    user.refreshTokens = (user.refreshTokens || []).filter((rt: { expiresAt: Date }) => rt.expiresAt > new Date());
    user.addRefreshToken(refreshHash, expiresAt, { userAgent: req.get('user-agent') || '', ip: req.ip });
    await user.save();

    // set httpOnly cookie
    setRefreshCookie(res, refreshPlain);

    return res.json({ user: { id: user._id, email: user.email, role: user.role }, accessToken });
  } catch (err) {
    console.error('adminLogin error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}