// server/src/controllers/adminStatsController.ts
import { Request, Response } from 'express';
import Post from '../models/Post';
import User from '../models/User';
import Comment from '../models/Comment';

/**
 * GET /api/admin/stats
 * Returns totals: posts, admins, users, comments
 */
export async function getStats(_req: Request, res: Response) {
  try {
    // run counts in parallel
    const [posts, admins, users, comments] = await Promise.all([
      Post.countDocuments({}),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: { $ne: 'admin' } }), // non-admin users
      Comment.countDocuments({})
    ]);

    return res.json({ posts, admins, users, comments });
  } catch (err) {
    console.error('getStats error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}


export async function getAdminPosts(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Query posts sorted by newest
    const [data, total] = await Promise.all([
      Post.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({})
    ]);

    return res.json({
      data: data as any[],
      meta: { total, page, limit }
    });
  } catch (err) {
    console.error('getAdminPosts error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}