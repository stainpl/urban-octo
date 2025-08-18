'use client';
import React from 'react';
import StatBox from './StatBox';

export function AdminsPanel({ count = 0 }: { count?: number }) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Admins</h2>
      <StatBox title="Total admins" value={count} description="Site administrators" />
      {/* list + pagination similar to RecentPosts */}
    </div>
  );
}

export function UsersPanel({ count = 0 }: { count?: number }) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Users</h2>
      <StatBox title="Total users" value={count} description="Registered users" />
    </div>
  );
}

export function CommentsPanel({ count = 0 }: { count?: number }) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Comments</h2>
      <StatBox title="Total comments" value={count} description="User comments" />
    </div>
  );
}