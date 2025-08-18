'use client';
import React, { forwardRef } from 'react';
import clsx from 'clsx';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | boolean;
  helper?: string;
  className?: string;
};

const base = 'w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-offset-1';

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, helper, className, ...rest }, ref) => {
  const id = rest.id || `input-${Math.random().toString(36).slice(2, 8)}`;
  const errorText = typeof error === 'string' ? error : undefined;
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && <label htmlFor={id} className="text-sm font-medium">{label}</label>}
      <input
        id={id}
        ref={ref}
        {...rest}
        className={clsx(
          base,
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          error ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-indigo-300'
        )}
      />
      {errorText ? <div className="text-xs text-red-500">{errorText}</div> : helper ? <div className="text-xs text-gray-500">{helper}</div> : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;