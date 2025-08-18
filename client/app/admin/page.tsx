'use client';
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import PostsPanel from '../components/admin/PostsPanel';

export default function AdminPage() {
  return (
    <AdminLayout>
      <PostsPanel />
    </AdminLayout>
  );
}