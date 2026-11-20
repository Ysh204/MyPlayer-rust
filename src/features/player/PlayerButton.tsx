import type { ButtonHTMLAttributes } from 'react';

export function PlayerButton({
  label, className = '', children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" className={`icon-button ${className}`} title={label} aria-label={label} {...props}>
      {children}
    </button>
  );
}
