import type { ReactElement } from 'react';
import logoMarkDarkUrl from '../assets/logo-mark-black.png';
import logoMarkLightUrl from '../assets/logo-mark.png';

interface LogoProps {
  className?: string;
  label?: string;
}

export function Logo({
  className = 'h-8 w-8',
  label = 'SyntaxAI',
}: LogoProps): ReactElement {
  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <img
        alt={label}
        className="h-full w-full object-contain dark:hidden"
        draggable={false}
        src={logoMarkDarkUrl}
      />
      <img
        alt=""
        aria-hidden
        className="hidden h-full w-full object-contain dark:block"
        draggable={false}
        src={logoMarkLightUrl}
      />
    </span>
  );
}
