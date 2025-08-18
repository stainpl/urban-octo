import React from 'react';
import Navbar from '@/app/components/Navbar';
import PostCard from '@/app/components/PostCard';
import { fetchPosts } from '@/app/lib/api';
import { Post } from '@/app/types/post';

export const revalidate = 10; 

export default async function BlogPage() {

  const json = await fetchPosts(0, 10).catch(() => ({ data: [] }));
  const posts: Post[] = json?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-gray-500">Latest posts</p>
        </header>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {posts.length === 0 && <div className="p-6 text-gray-500">No posts yet.</div>}
          {posts.map((p) => (
            <PostCard key={p._id} post={p} />
          ))}
        </div>
      </main>
    </div>
  );
}
