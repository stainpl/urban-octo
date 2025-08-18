import { Request, Response } from 'express';
import Post from '../models/Post';

export const getPosts = async (req: Request, res: Response) => {
  const page = Math.max(0, Number(req.query.page) || 0);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();
    const total = await Post.countDocuments({});
    res.json({ data: posts, meta: { total } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPostBySlug = async (req: Request, res: Response) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).lean();
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, tags = [], excerpt, authorName } = req.body;
    const slug = (title || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const exists = await Post.findOne({ slug });
    if (exists) return res.status(400).json({ error: 'Slug exists' });
    const post = await Post.create({ title, content, slug, tags, excerpt, authorName });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
