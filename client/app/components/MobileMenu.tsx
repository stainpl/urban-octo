'use client';
import React from 'react';
import Link from 'next/link';
import { FiHome, FiFileText, FiUser, FiSearch, FiBell } from 'react-icons/fi';

export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="md:hidden bg-white border-t">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3">
        <Link href="/" onClick={onClose} className="flex items-center gap-2 text-lg"><FiHome/> Home</Link>
        <Link href="/my-blog" onClick={onClose} className="flex items-center gap-2 text-lg"><FiFileText/> Blog</Link>
        <Link href="/about" onClick={onClose} className="flex items-center gap-2 text-lg"><FiUser/> About</Link>
        <div className="flex gap-3 mt-2">
          <button className="flex-1 text-left py-2 border rounded">Search</button>
          <button className="flex-1 text-left py-2 border rounded">Notifications</button>
        </div>
      </div>
    </div>
  );
}
