'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FiFileText, FiUsers, FiUserPlus, FiMessageSquare, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

const items = [
  { id: 'posts', label: 'Posts', href: '/admin', Icon: FiFileText },
  { id: 'admins', label: 'Admins', href: '/admin/admins', Icon: FiUserPlus },
  { id: 'users', label: 'Users', href: '/admin/users', Icon: FiUsers },
  { id: 'comments', label: 'Comments', href: '/admin/comments', Icon: FiMessageSquare },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('admin_sidebar_collapsed', collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  return (
    <aside className={`bg-white dark:bg-gray-900 border-r h-screen transition-all ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex flex-col h-full">
        <div className="px-3 py-4 flex items-center gap-3">
          {!collapsed && <div className="text-lg font-semibold">Admin</div>}
          <div className="ml-auto" />
        </div>

        <nav className="flex-1 px-1 py-2">
          {items.map(({ id, label, href, Icon }) => (
            <Link key={id} href={href} className={`flex items-center gap-3 py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition ${collapsed ? 'justify-center' : ''}`}>
              <Icon className="text-lg" />
              {!collapsed && <span className="text-sm">{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t">
          <button
            onClick={() => setCollapsed(s => !s)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Collapse sidebar"
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}