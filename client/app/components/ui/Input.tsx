'use client';
import React, { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { FiEye, FiEyeOff } from 'react-icons/fi';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | boolean;
  helper?: string;
  className?: string;
  showPasswordToggle?: boolean;
};

const base = 'w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-offset-1';

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, helper, className, showPasswordToggle, ...rest }, ref) => {
  const id = rest.id || `input-${Math.random().toString(36).slice(2, 8)}`;
  const errorText = typeof error === 'string' ? error : undefined;

  const [show, setShow] = useState(false);
  const isPassword = rest.type === 'password';

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && <label htmlFor={id} className="text-sm font-medium">{label}</label>}

      <div className="relative">
        <input
          id={id}
          ref={ref}
          {...rest}
          type={isPassword && show ? 'text' : rest.type}
          className={clsx(
            base,
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            error ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-indigo-300',
            isPassword && showPasswordToggle ? 'pr-10' : ''
          )}
        />

        {isPassword && showPasswordToggle && (
          <button
            type="button"
            aria-label={show ? 'Hide password' : 'Show password'}
            onClick={() => setShow(s => !s)}
            className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-600 dark:text-gray-300"
          >
            {show ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {errorText ? (
        <div className="text-xs text-red-500">{errorText}</div>
      ) : helper ? (
        <div className="text-xs text-gray-500">{helper}</div>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
