'use client';

import { forwardRef } from 'react';
import clsx from 'clsx';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 border-primary-500 shadow-sm hover:shadow',
  secondary:
    'bg-white text-primary-500 hover:bg-primary-50 border-primary-500 shadow-sm',
  danger:
    'bg-red-500 text-white hover:bg-red-600 border-red-500 shadow-sm',
  ghost:
    'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center gap-1.5 rounded-xl border font-semibold',
          'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1',
          'transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {rightIcon && !isLoading && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
