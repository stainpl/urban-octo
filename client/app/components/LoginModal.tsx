'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginModal({ onClose }: { onClose?: () => void }) {
  const { login, register, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      setMessage('Success');
      onClose?.();
    } catch (err: unknown) {
      const error = err as Error;
      setMessage(error?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    if (!email) return setMessage('Enter email to reset');
    try {
      await requestPasswordReset(email);
      setMessage('If the email exists you will receive reset instructions');
    } catch (err: unknown) {
      const error = err as Error;
      setMessage(error?.message || 'Failed');
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-md p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{mode === 'login' ? 'Login' : 'Sign up'}</h3>
          <div className="flex gap-2">
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm underline">
              {mode === 'login' ? 'Switch to Sign up' : 'Switch to Login'}
            </button>
            <button onClick={onClose} className="text-sm">Close</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="input" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" className="input" />
          <div className="flex items-center justify-between">
            <button disabled={loading} type="submit" className="btn">
              {loading ? '...' : (mode === 'login' ? 'Login' : 'Sign up')}
            </button>
            <button type="button" onClick={handleForgot} className="text-sm underline">Forgot password?</button>
          </div>
        </form>

        {message && <div className="mt-3 text-sm text-red-500">{message}</div>}
      </div>
    </div>
  );
}