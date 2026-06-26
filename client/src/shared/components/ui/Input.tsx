'use client';

import { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
            'placeholder:text-gray-400',
            'transition-shadow duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 hover:border-gray-300',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        {helpText && !error && <p className="mt-1.5 text-xs text-gray-500">{helpText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
