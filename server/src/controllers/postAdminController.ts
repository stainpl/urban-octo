import { Request, Response } from 'express';
import Post from '../models/Post';
import sanitizeHtml from 'sanitize-html';
import { upload, makeResponsiveImages } from '../utils/upload';
import { hashToken } from '../utils/jwt';
import { Types } from 'mongoose';
import slugify from 'slugify';

function cleanHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['gimg', 'h1', 'h2', 'u']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height', 'style']
    }
  });
}



export async function createAdminPost(req: Request, res: Response) {
  try {
    // req.user assumed set by requireAuth (admin)
    const { title, body, categories, featuredUrl } = req.body;
    if (!title || (!body && !req.file)) return res.status(400).json({ error: 'Title and body required' });

    // categories may be JSON or CSV
    let cats: string[] = [];
    if (categories) {
      try {
        cats = typeof categories === 'string' && categories.trim().startsWith('[') ? JSON.parse(categories) : String(categories).split(',').map(s => s.trim()).filter(Boolean);
      } catch {
        cats = String(categories).split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const cleanBody = cleanHtml(body || '');

    let featured: { url: string; responsive?: { width: number; url: string }[] } | undefined;
    if (req.file) {
      const outputs = await makeResponsiveImages(req.file.path);
      featured = { url: outputs[0].url, responsive: outputs.map(o => ({ width: o.width, url: o.url })) };
    } else if (featuredUrl) {
      if (!/^https?:\/\//.test(featuredUrl)) return res.status(400).json({ error: 'Invalid featured image URL' });
      featured = { url: featuredUrl, responsive: [] };
    }

    let slug = slugify(title, { lower: true, strict: true });
    const exists = await Post.findOne({ slug });
    if (exists) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const excerpt = cleanBody.replace(/<[^>]+>/g, '').slice(0, 200);

    const post = await Post.create({
      title: title.trim(),
      slug,
      content: cleanBody,
      excerpt,
      tags: cats,
      featuredImage: featured,
      authorName: (req as any).user?.email || 'admin'
    });

    return res.status(201).json({ ok: true, post });
  } catch (err) {
    console.error('createAdminPost error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}