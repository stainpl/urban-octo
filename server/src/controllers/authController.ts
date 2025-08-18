import 'dotenv/config';

import { Request, Response } from 'express';
import User, { IRefreshToken } from '../models/User';
import { signAccessToken, genRefreshTokenPlain, hashToken } from '../utils/jwt';

import nodemailer from 'nodemailer';
import crypto from 'crypto';
import Invite from '../models/Invite';

const INVITE_EXPIRES_HOURS = Number(process.env.INVITE_EXPIRES_HOURS || 24);

const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_EXPIRES_DAYS || 30);
const RESET_TOKEN_EXPIRES_HOURS = Number(process.env.RESET_TOKEN_EXPIRES_HOURS || 1);
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'jid';

// ----- Email helper (simple nodemailer). Replace with a real provider in prod -----
async function sendMail(to: string, subject: string, text: string, html?: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });
}

// Helper: set refresh cookie
function setRefreshCookie(res: Response, token: string, days = REFRESH_TOKEN_EXPIRES_DAYS) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: days * 24 * 60 * 60 * 1000,
    path: '/'
  };
  res.cookie(REFRESH_COOKIE_NAME, token, cookieOptions);
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
}

// ---------- Controllers ----------

export async function register(req: Request, res: Response) {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    // No admin signup via this route: force role to 'user' unless explicitly controlled elsewhere
    const user = new User({ email, password, role: role === 'admin' ? 'user' : (role || 'user') });
    await user.save();

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });

    const refreshPlain = genRefreshTokenPlain();
    const refreshHash = hashToken(refreshPlain);
    const rtExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    user.addRefreshToken(refreshHash, rtExpiresAt, { userAgent: req.get('user-agent') || '', ip: req.ip });
    await user.save();

    setRefreshCookie(res, refreshPlain);

    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role }, accessToken });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });

    // refresh token - rotation
    const refreshPlain = genRefreshTokenPlain();
    const refreshHash = hashToken(refreshPlain);
    const rtExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    // optionally prune expired tokens
    user.refreshTokens = (user.refreshTokens || []).filter((rt: IRefreshToken) => rt.expiresAt > new Date());
    user.addRefreshToken(refreshHash, rtExpiresAt, { userAgent: req.get('user-agent') || '', ip: req.ip });

    await user.save();

    setRefreshCookie(res, refreshPlain);
    res.json({ user: { id: user._id, email: user.email, role: user.role }, accessToken });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function inviteAdmin(req: Request, res: Response) {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Invite already sent to this email' });

    const tokenPlain = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(tokenPlain);
    const inviteExpiresAt = new Date(Date.now() + INVITE_EXPIRES_HOURS * 60 * 60 * 1000);

    const invite = new Invite({ email, tokenHash, role: 'admin', expiresAt: inviteExpiresAt });
    await invite.save();

    // Send invite email
    const acceptUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${tokenPlain}&email=${encodeURIComponent(email)}`;
    const subject = 'Admin Invite';
    const text = `You have been invited as an admin. Click the link to accept (expires in ${INVITE_EXPIRES_HOURS}h): ${acceptUrl}`;
    await sendMail(email, subject, text, `<p>${text}</p>`);

    res.json({ ok: true, message: 'Invite sent successfully' });
  } catch (err) {
    console.error('inviteAdmin error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function acceptInvite(req: Request, res: Response) {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({ error: 'Token, email & password required' });
    }

    const tokenHash = hashToken(token);
    const invite = await Invite.findOne({ email, tokenHash, expiresAt: { $gt: new Date() } });
    if (!invite) return res.status(400).json({ error: 'Invalid or expired invite' });

    // Create refresh pieces (we'll use them whether user exists or not)
    const refreshPlain = genRefreshTokenPlain();
    const refreshHash = hashToken(refreshPlain);
    const rtExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    let user = await User.findOne({ email });
    let accessToken: string;

    if (user) {
      // Upgrade role if needed
      if (user.role !== invite.role) {
        user.role = invite.role;
      }

      // Update password policy: only overwrite if you intend to
      // If your model hashes password in a pre-save hook, assigning plain is OK,
      // otherwise hash it here before saving.
      if (password) {
        user.password = password;
      }

      user.refreshTokens = user.refreshTokens || [];
      user.addRefreshToken(refreshHash, rtExpiresAt, { userAgent: req.get('user-agent') || '', ip: req.ip });

      await user.save();
      accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });

    } else {
      // create new user
      user = new User({ email, password, role: invite.role });
      user.refreshTokens = [];
      user.addRefreshToken(refreshHash, rtExpiresAt, { userAgent: req.get('user-agent') || '', ip: req.ip });

      await user.save();
      accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    }

    // Remove invite once accepted
    await Invite.deleteOne({ _id: invite._id });

    // Set refresh cookie and return tokens
    setRefreshCookie(res, refreshPlain);

    res.json({ user: { id: user._id, email: user.email, role: user.role }, accessToken });
  } catch (err) {
    console.error('acceptInvite error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const tokenPlain = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!tokenPlain) return res.status(401).json({ error: 'No refresh token' });

    const tokenHash = hashToken(tokenPlain);
    const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash });
    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // find the token entry
    const tokenEntry = user.refreshTokens.find((rt: IRefreshToken) => rt.tokenHash === tokenHash);
    if (!tokenEntry || tokenEntry.expiresAt <= new Date()) {
      // remove token
      user.removeRefreshToken(tokenHash);
      await user.save();
      clearRefreshCookie(res);
      return res.status(401).json({ error: 'Refresh token expired or invalid' });
    }

    // rotation: remove used token and issue a new one
    user.removeRefreshToken(tokenHash);
    const newRefreshPlain = genRefreshTokenPlain();
    const newRefreshHash = hashToken(newRefreshPlain);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    user.addRefreshToken(newRefreshHash, newExpiresAt, { userAgent: req.get('user-agent') || '', ip: req.ip });
    await user.save();

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });

    setRefreshCookie(res, newRefreshPlain);
    res.json({ user: { id: user._id, email: user.email, role: user.role }, accessToken });
  } catch (err) {
    console.error('refresh error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const tokenPlain = req.cookies?.[REFRESH_COOKIE_NAME];
    if (tokenPlain) {
      const tokenHash = hashToken(tokenPlain);
      // remove token from any user that has it
      const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash });
      if (user) {
        user.removeRefreshToken(tokenHash);
        await user.save();
      }
    }
    clearRefreshCookie(res);
    res.json({ ok: true });
  } catch (err) {
    console.error('logout error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) {
      // don't reveal whether email exists
      return res.json({ ok: true });
    }

    // create reset token (plaintext for email), store hashed in user
    const resetPlain = crypto.randomBytes(32).toString('hex');
    const resetHash = hashToken(resetPlain);
    user.resetPasswordToken = resetHash;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_HOURS * 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetPlain}&email=${encodeURIComponent(email)}`;
    const subject = 'Password reset';
    const text = `You (or someone) requested a password reset. Click the link to reset (expires in ${RESET_TOKEN_EXPIRES_HOURS}h): ${resetUrl}`;
    await sendMail(email, subject, text, `<p>${text}</p>`);

    res.json({ ok: true });
  } catch (err) {
    console.error('forgotPassword error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) return res.status(400).json({ error: 'Invalid request' });

    const tokenHash = hashToken(token);
    const user = await User.findOne({ email, resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    user.refreshTokens = [];

    await user.save();

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const refreshPlain = genRefreshTokenPlain();
    const refreshHash = hashToken(refreshPlain);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    user.addRefreshToken(refreshHash, expiresAt, { userAgent: req.get('user-agent') || '', ip: req.ip });
    await user.save();

    setRefreshCookie(res, refreshPlain);

    res.json({ ok: true, user: { id: user._id, email: user.email, role: user.role }, accessToken });
  } catch (err) {
    console.error('resetPassword error', err);
    res.status(500).json({ error: 'Server error' });
  }
}
