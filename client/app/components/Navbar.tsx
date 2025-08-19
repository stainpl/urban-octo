'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiMenu, FiX, FiHome, FiFileText, FiUser, FiUserPlus, FiLogIn, FiLogOut, FiSearch, FiBell, FiGrid
} from 'react-icons/fi';

import LoginModal from './LoginModal'; 
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function toggleMenu() {
    if (!open) {
      setOpen(true);
      return;
    }
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setOpen(false);
    }, 300);
  }

  function handleLogout() {
    logout();
  }

  // helper to compute active link style
  const activeClass = (cond: boolean) => cond ? 'bg-gray-100 dark:bg-gray-800 rounded-md' : '';

  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">B</div>
          <span className="font-semibold text-lg">Blog Web App</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={`link-gradient flex items-center gap-2 text-sm px-2 py-1 ${activeClass(pathname === '/')}`}>
            <FiHome/> Home
          </Link>

          <Link href="/my-blog" className={`link-gradient flex items-center gap-2 text-sm px-2 py-1 ${activeClass(pathname.startsWith('/my-blog'))}`}>
            <FiFileText/> Blog
          </Link>

          <Link href="/about" className={`link-gradient flex items-center gap-2 text-sm px-2 py-1 ${activeClass(pathname === '/about')}`}>
            <FiUser/> About
          </Link>

          <button aria-label="search" className="p-1 rounded hover:bg-gray-500"><FiSearch/></button>
          <button aria-label="contact" className="p-1 rounded hover:bg-gray-500"><FiBell/></button>

          {/* Admin Dashboard link — only visible to admins */}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`flex items-center gap-2 text-sm px-3 py-1 border rounded hover:bg-gray-50 ${activeClass(pathname.startsWith('/admin'))}`}
              title="Admin Dashboard"
            >
              <FiGrid /> Dashboard
            </Link>
          )}

          {/* Right side: login/signup or user + logout */}
          {!user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 text-sm px-3 py-1 border rounded hover:bg-gray-50"
                title="Login / Sign up"
              >
                <FiLogIn /> Login / Sign up
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm hidden md:inline">{user.email}</span>

              {/* If admin, quick link to admin area shown above */}
              {/* TODO: later add a "View Profile" button here for normal users */}
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded hover:bg-gray-100 flex items-center"
                aria-label="logout"
              >
                <FiLogOut />
              </button>
            </div>
          )}
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center">
          {!user ? (
            <button onClick={() => setShowLoginModal(true)} className="mr-2 p-2 rounded border text-sm" aria-label="open login">
              <FiLogIn />
            </button>
          ) : (
            <button onClick={handleLogout} className="mr-2 p-2 rounded border" title="Logout">
              <FiLogOut />
            </button>
          )}

          <button
            onClick={toggleMenu}
            aria-label="menu"
            className="p-2 rounded focus:outline-none"
          >
            {!open ? (
              <FiMenu size={20} />
            ) : (
              <FiX size={20} className={isClosing ? 'animate-spin' : ''} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden bg-gray-500 border-t">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 text-lg"><FiHome/> Home</Link>
            <Link href="/my-blog" onClick={() => setOpen(false)} className="flex items-center gap-2 text-lg"><FiFileText/> Blog</Link>
            <Link href="/about" onClick={() => setOpen(false)} className="flex items-center gap-2 text-lg"><FiUser/> About</Link>

            <div className="flex gap-3 mt-2">
              <button className="flex-1 py-2 rounded border flex items-center justify-center gap-2" onClick={() => { /* search stub */ }}>
                <FiSearch /> Search
              </button>
              <button className="flex-1 py-2 rounded border flex items-center justify-center gap-2" onClick={() => { /* notif stub */ }}>
                <FiBell /> Notification
              </button>
            </div>

            <div className="border-t pt-3">
              {!user ? (
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setShowLoginModal(true); setOpen(false); }} className="py-2 rounded border flex items-center justify-center gap-2">
                    <FiUser /> Login / Sign up
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">{user.email.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="text-sm font-medium">{user.email}</div>
                        <div className="text-xs text-gray-500">{user.role}</div>
                      </div>
                    </div>
                  </div>

                  {/* Admin link in mobile menu */}
                  {user.role === 'admin' && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="py-2 rounded border flex items-center justify-center gap-2">
                      <FiGrid /> Dashboard
                    </Link>
                  )}

                  <button onClick={() => { handleLogout(); setOpen(false); }} className="mt-3 py-2 rounded border flex items-center justify-center gap-2">
                    <FiLogOut /> Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login modal */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </header>
  );
}