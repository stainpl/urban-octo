'use client';
import React from 'react';
import Link from 'next/link';
import { Post } from '../types/post';

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="border rounded-md p-4 shadow-sm hover:shadow-md transition">
      <h3 className="text-xl font-semibold mb-1">{post.title}</h3>
      <p className="text-sm text-gray-500 mb-3">{post.excerpt || post.content.slice(0, 140) + '...'}</p>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</div>
        <Link href={`/my-blog/${post.slug}`} className="text-sm font-medium text-blue-600">Read</Link>
      </div>
    </article>
  );
}
