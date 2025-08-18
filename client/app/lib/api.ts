const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

export async function fetchPosts(page = 0, limit = 10) {
  const url = `${API_BASE}/posts?page=${page}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load posts');
  return res.json();
}

export async function fetchPost(slug: string) {
  const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error('Post not found');
  return res.json();
}
