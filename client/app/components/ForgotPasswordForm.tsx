'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setMsg('If that email exists you will receive instructions.');
    } catch (err: unknown) {
      const error = err as Error;
      setMsg(error?.message || 'Error');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto p-4">
      <input className="input" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
      <button className="btn mt-3" disabled={loading}>{loading ? '...' : 'Request reset'}</button>
      {msg && <div className="mt-2 text-sm">{msg}</div>}
    </form>
  );
}