'use client';
import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

type Props = {
  title: string;
  icon?: React.ReactNode;
  value: number;
  description?: string;
  className?: string;
};

export default function StatBox({ title, icon, value, description, className }: Props) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let start: number | null = null;
    const duration = 800;
    const from = display;
    const to = value;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const val = Math.floor(from + (to - from) * progress);
      setDisplay(val);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    cancelAnimationFrame(rafRef.current ?? 0);
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // re-run when value changes

  return (
    <div className={clsx('bg-white dark:bg-gray-800 border rounded p-4 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-gray-400">{title}</div>
          <div className="text-2xl font-semibold mt-1">{display.toLocaleString()}</div>
          {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
        </div>
        {icon && <div className="text-2xl text-indigo-600">{icon}</div>}
      </div>
    </div>
  );
}