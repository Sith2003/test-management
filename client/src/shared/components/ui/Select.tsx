'use client';

import { forwardRef } from 'react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helpText, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
            'transition-shadow duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 hover:border-gray-300',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        {helpText && !error && <p className="mt-1.5 text-xs text-gray-500">{helpText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
