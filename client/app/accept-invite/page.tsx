'use client';
import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/admin/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, email, password })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed');
      setMsg('Account created. Redirecting...');
      setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
      setMsg(err?.message || 'Error');
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl mb-4">Accept admin invite</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input value={email} readOnly className="input" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose password" type="password" className="input" />
        <button className="btn">Create admin</button>
      </form>
      {msg && <div className="mt-3">{msg}</div>}
    </div>
  );
}