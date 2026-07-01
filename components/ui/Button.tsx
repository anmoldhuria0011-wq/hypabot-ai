'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[#3b82f6] text-white',
    'border border-[#3b82f6]',
    'hover:bg-[#2563eb] hover:border-[#2563eb]',
    'focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]',
    'disabled:bg-[#1e3a5f] disabled:border-[#1e3a5f] disabled:text-[#6b7280] disabled:cursor-not-allowed',
    'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    'hover:shadow-[0_0_30px_rgba(59,130,246,0.35)]',
  ].join(' '),

  secondary: [
    'bg-transparent text-[#f0f0f0]',
    'border border-[rgba(255,255,255,0.12)]',
    'hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.2)]',
    'focus-visible:ring-2 focus-visible:ring-[rgba(255,255,255,0.3)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-full font-medium tracking-wide',
        'transition-all duration-300 outline-none',
        'cursor-pointer select-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      disabled={isDisabled}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
