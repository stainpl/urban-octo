'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import RoundLoader from '@/app/components/ui/RoundLoader';
import Input from '@/app/components/ui/Input';
import { FiX } from 'react-icons/fi';
import { useToast } from '@/app/components/ui/ToastProvider';

export default function LoginModal({ onClose }: { onClose?: () => void }) {
  const { login, register, requestPasswordReset } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });

  const [pwScore, setPwScore] = useState<number | null>(null);
  const [pwFeedback, setPwFeedback] = useState<string | null>(null);

  const MIN_PASSWORD_LENGTH = 8;

  useEffect(() => {
    let mounted = true;
    if (mode === 'signup' && password.length > 0) {
      import('zxcvbn')
        .then(mod => {
          if (!mounted) return;
          const fn = (mod && (mod.default || mod)) as any;
          try {
            const res = fn(password);
            setPwScore(res.score);
            const feedback = (res.feedback && (res.feedback.warning || res.feedback.suggestions?.[0])) || null;
            setPwFeedback(feedback);
          } catch (e) {
            setPwScore(null);
            setPwFeedback(null);
          }
        })
        .catch(() => {
          setPwScore(null);
          setPwFeedback(null);
        });
    } else {
      setPwScore(null);
      setPwFeedback(null);
    }
    return () => {
      mounted = false;
    };
  }, [password, mode]);

  function resetForm() {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setTouched({ email: false, password: false, confirmPassword: false });
    setPwScore(null);
    setPwFeedback(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });

    if (mode === 'signup') {
      if (!password || !confirmPassword) {
        toast.error('Please enter and confirm your password');
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        return;
      }
    }

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('Logged in');
      } else {
        await register(email, password);
        toast.success('Account created');
      }
      resetForm();
      onClose?.();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    if (!email) return toast.info('Enter email to reset');
    try {
      await requestPasswordReset(email);
      toast.info('If the email exists you will receive reset instructions');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to request password reset');
    }
  }

  function handleClose() {
    if (closing) return;
    setClosing(true);
    const spinDuration = 400; 
    setTimeout(() => {
      onClose?.();
      setClosing(false);
    }, spinDuration);
  }

  function handleModeSwitch() {
    setMode(prev => (prev === 'login' ? 'signup' : 'login'));
    resetForm();
  }

  const passwordsMatch = mode === 'signup' ? password === confirmPassword : true;
  const hasValidPassword = mode === 'signup' ? password.length >= MIN_PASSWORD_LENGTH : !!password;
  const canSubmit = !loading && email.trim() !== '' && hasValidPassword && passwordsMatch;

  const emailError = touched.email && !email ? 'Email is required' : undefined;
  const passwordError = touched.password && mode === 'signup' && password.length < MIN_PASSWORD_LENGTH ? `At least ${MIN_PASSWORD_LENGTH} characters` : undefined;
  const confirmError = touched.confirmPassword && mode === 'signup' && password !== confirmPassword ? "Passwords don't match" : undefined;

  const strengthLabel = pwScore === null ? null : ['Very weak', 'Weak', 'Okay', 'Good', 'Strong'][pwScore];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-md p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{mode === 'login' ? 'Login' : 'Sign up'}</h3>

          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-sm underline"
            >
              {mode === 'login' ? 'Switch to Sign up' : 'Switch to Login'}
            </button>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close modal"
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={loading}
            >
              <FiX className={`w-5 h-5 ${closing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, email: true }))}
            autoComplete="email"
            error={emailError}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, password: true }))}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            error={passwordError}
            helper={mode === 'signup' ? `Minimum ${MIN_PASSWORD_LENGTH} characters` : undefined}
            showPasswordToggle
          />

          {mode === 'signup' && pwScore !== null && (
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full bg-gray-100 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all`} 
                  style={{ width: `${((pwScore + 1) / 5) * 100}%`, background: ['#f87171', '#f97316', '#f59e0b', '#60a5fa', '#10b981'][pwScore] }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{strengthLabel}</span>
                {pwFeedback && <span className="italic">{pwFeedback}</span>}
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <Input
              id="confirmPassword"
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, confirmPassword: true }))}
              autoComplete="new-password"
              error={confirmError}
              showPasswordToggle
            />
          )}

          <div className="flex items-center justify-between">
            <button
              disabled={!canSubmit}
              type="submit"
              className={`btn flex items-center justify-center gap-2 ${!canSubmit ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <RoundLoader size={18} thickness={3} />
              ) : (
                mode === 'login' ? 'Login' : 'Sign up'
              )}
            </button>

            <button type="button" onClick={handleForgot} className="text-sm underline">Forgot password?</button>
          </div>
        </form>

      </div>
    </div>
  );
}
