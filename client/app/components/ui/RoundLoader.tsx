'use client';
import React from 'react';

export default function RoundLoader({ size = 36, className = '' }: { size?: number; className?: string }) {
  const s = size;
  return (
    <div role="status" aria-live="polite" className={`inline-block ${className}`}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 50 50"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth="4"
          strokeOpacity="0.2"
          fill="none"
        />
        <path
          d="M45 25a20 20 0 0 1-20 20"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="sr-only">Loading…</span>
    </div>
  );
}