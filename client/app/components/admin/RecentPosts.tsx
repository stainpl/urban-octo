'use client';
import React, { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import RoundLoader from '../ui/RoundLoader';
import { useAuth } from '@/context/AuthContext';

type Post = {
  _id: string;
  title: string;
  slug?: string;
  createdAt: string;
  authorName?: string;
};

export default function RecentPosts({ initialPage = 1 }: { initialPage?: number }) {
  const [page, setPage] = useState(initialPage);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';
  const { accessToken } = useAuth();

  const perPage = 20;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const q = new URL(`${API}/admin/posts`).searchParams;
    q.set('limit', String(perPage));
    q.set('page', String(page));

    fetch(`${API}/admin/posts?limit=${perPage}&page=${page}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        if (!mounted) return;
        setPosts(json.data || []);
        setTotal(json.meta?.total || 0);
      })
      .catch(err => {
        console.error(err);
        if (mounted) setPosts([]);
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [page, API, accessToken]);

  return (
    <div className="bg-white dark:bg-gray-800 border rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Recent posts</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{Math.min((page - 1) * perPage + 1, total)} - {Math.min(page * perPage, total)} of {total}</span>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-gray-100">
            <FiChevronLeft />
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * perPage >= total} className="p-1 rounded hover:bg-gray-100">
            <FiChevronRight />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><RoundLoader /></div>
      ) : posts.length === 0 ? (
        <div className="text-sm text-gray-500 py-6">No posts found.</div>
      ) : (
        <ul className="space-y-3">
          {posts.map(p => (
            <li key={p._id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-gray-500">{p.authorName || 'Anonymous'} · {new Date(p.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm text-indigo-600">
                <a href={`/my-blog/${p.slug || ''}`} target="_blank" rel="noreferrer">View</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}