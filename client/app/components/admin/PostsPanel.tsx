'use client';
import React, { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import StatBox from './StatBox';
import RecentPosts from './RecentPosts';
import { useAuth } from '@/context/AuthContext';

type Stats = {
  posts: number;
  admins: number;
  users: number;
  comments: number;
};

export default function PostsPanel() {
  const [stats, setStats] = useState<Stats>({ posts: 0, admins: 0, users: 0, comments: 0 });
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API}/admin/stats`, { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        if (!mounted) return;
        setStats({
          posts: json.posts || 0,
          admins: json.admins || 0,
          users: json.users || 0,
          comments: json.comments || 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [API, accessToken]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-sm text-gray-500">Manage blog posts and content</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin/posts/new" className="inline-flex items-center gap-2 px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
            <FiPlus /> New Post
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatBox title="Total posts" value={stats.posts} icon={<FiPlus />} description={loading ? 'loading...' : 'All articles'} />
        <StatBox title="Admins" value={stats.admins} icon={<FiUserPlus />} description="Total admins" />
        <StatBox title="Users" value={stats.users} icon={<FiUsers />} description="Registered users" />
        <StatBox title="Comments" value={stats.comments} icon={<FiMessageSquare />} description="User comments" />
      </div>

      <RecentPosts initialPage={1} />
    </div>
  );
}

// note: import icons
import { FiUserPlus, FiUsers, FiMessageSquare } from 'react-icons/fi';