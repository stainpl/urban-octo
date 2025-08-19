'use client';
import React from 'react';
import AdminLayout from '@/app/components/admin/AdminLayout';
import NewPostForm from '@/app/components/admin/NewPostForm';

export default function NewPostPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <NewPostForm />
      </div>
    </AdminLayout>
  );
}