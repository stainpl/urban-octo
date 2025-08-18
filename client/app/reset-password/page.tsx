'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, email, password })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed');
      setMsg('Password reset ok. Redirecting...');
      setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
      setMsg(err?.message || 'Error');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl mb-4">Reset password</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input value={email} readOnly className="input" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" type="password" className="input" />
        <button disabled={loading} className="btn">{loading ? '...' : 'Reset password'}</button>
      </form>
      {msg && <div className="mt-3">{msg}</div>}
    </div>
  );
}