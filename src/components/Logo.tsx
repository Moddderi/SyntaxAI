import type { ReactElement } from 'react';
import logoUrl from '../assets/logo.svg';

interface LogoProps {
  className?: string;
  label?: string;
}

export function Logo({
  className = 'h-8 w-8',
  label = 'SyntaxAI',
}: LogoProps): ReactElement {
  return (
    <img
      alt={label}
      className={className}
      draggable={false}
      src={logoUrl}
    />
  );
}
