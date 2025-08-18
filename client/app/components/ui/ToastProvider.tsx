'use client';
import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiInfo, FiAlertCircle, FiX } from 'react-icons/fi';

type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number; 
};

type ToastContextShape = {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => string;
  remove: (id: string) => void;
  success: (title: string, desc?: string, duration?: number) => string;
  error: (title: string, desc?: string, duration?: number) => string;
  info: (title: string, desc?: string, duration?: number) => string;
};

const ToastContext = createContext<ToastContextShape | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = cryptoRandomId();
    const item: ToastItem = { id, ...t };
    setToasts(s => [item, ...s]);
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(s => s.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string, duration = 4000) => {
    return push({ title, description, type: 'success', duration });
  }, [push]);
  const error = useCallback((title: string, description?: string, duration = 6000) => {
    return push({ title, description, type: 'error', duration });
  }, [push]);
  const info = useCallback((title: string, description?: string, duration = 4000) => {
    return push({ title, description, type: 'info', duration });
  }, [push]);

  useEffect(() => {
    const timers: Record<string, number> = {};
    toasts.forEach(t => {
      if (t.duration && !timers[t.id]) {
        timers[t.id] = window.setTimeout(() => remove(t.id), t.duration);
      }
    });
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [toasts, remove]);

  const ctx = useMemo(() => ({ toasts, push, remove, success, error, info }), [toasts, push, remove, success, error, info]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}


function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 9);
}

function ToastContainer({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) {
  return (
    <div aria-live="polite" className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map(t => (
        <Toast key={t.id} item={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const { title, description, type = 'info' } = item;

  const color = type === 'success' ? 'bg-green-50 border-green-200' : type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
  const icon = type === 'success' ? <FiCheckCircle /> : type === 'error' ? <FiAlertCircle /> : <FiInfo />;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 p-3 rounded-md border shadow-sm ${color} animate-slide-in`}
      style={{ minWidth: 300 }}
    >
      <div className="text-xl text-current opacity-90">{icon}</div>
      <div className="flex-1">
        {title && <div className="font-semibold text-sm">{title}</div>}
        {description && <div className="text-xs text-gray-600 mt-1 line-clamp-3">{description}</div>}
      </div>
      <button aria-label="close" onClick={onClose} className="p-1 rounded hover:bg-black/5">
        <FiX />
      </button>
    </div>
  );
}