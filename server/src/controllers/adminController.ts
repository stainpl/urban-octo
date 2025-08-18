// server/src/controllers/adminController.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import Invite from '../models/Invite';
import { hashToken } from '../utils/jwt';
import User from '../models/User';
import { sendMail } from '../utils/mailHelper'; 
import { Types } from 'mongoose';

const INVITE_EXPIRE_HOURS = Number(process.env.INVITE_EXPIRE_HOURS || 72);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Local Request type that includes a possible `user` populated by your auth middleware.
 * Use this in controller signatures to avoid "Property 'user' does not exist on type 'Request'" errors.
 */
type AuthRequest = Request & {
  user?: { id?: string | Types.ObjectId; email?: string; role?: string };
};

export async function inviteAdmin(req: AuthRequest, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // ensure target not already admin
    const existing = await User.findOne({ email });
    if (existing && existing.role === 'admin') return res.status(400).json({ error: 'User already admin' });

    // generate plain token and hashed version for DB
    const plain = crypto.randomBytes(32).toString('hex');
    const hashed = hashToken(plain);
    const expiresAt = new Date(Date.now() + INVITE_EXPIRE_HOURS * 60 * 60 * 1000);

    const invite = new Invite({
      email,
      tokenHash: hashed,
      expiresAt,
      invitedBy: req.user?.id || undefined
    });
    await invite.save();

    const link = `${FRONTEND_URL}/accept-invite?token=${plain}&email=${encodeURIComponent(email)}`;

    // send email using your mail helper `sendMail`
    await sendMail({
      to: email,
      subject: 'Admin invite',
      text: `You were invited to be an admin. Use link: ${link}`,
      html: `<p>You were invited to be an admin. Click <a href="${link}">this link</a> to accept the invite.</p><p>If the button doesn't work: ${link}</p>`
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('inviteAdmin error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function acceptInvite(req: Request, res: Response) {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) return res.status(400).json({ error: 'Invalid request' });

    const tokenHash = hashToken(token);
    const invite = await Invite.findOne({ email, tokenHash, expiresAt: { $gt: new Date() } });
    if (!invite) return res.status(400).json({ error: 'Invalid or expired invite' });

    // create or upgrade user to admin
    let user = await User.findOne({ email });
    if (user) {
      user.password = password;
      user.role = 'admin';
      // clear refresh tokens if you'd like to force re-login everywhere:
      user.refreshTokens = [];
      await user.save();
    } else {
      user = new User({ email, password, role: 'admin' });
      await user.save();
    }

    invite.acceptedAt = new Date();
    await invite.save();

    // Optionally: auto-login the user here (issue tokens & set cookie). For now return success.
    return res.json({ ok: true });
  } catch (err) {
    console.error('acceptInvite error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}