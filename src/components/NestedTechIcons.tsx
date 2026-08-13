import type { ReactElement } from 'react';
import { TechIcon } from './TechIcon';
import { shouldNestLanguageIcon } from '../utils/techIcon';

interface NestedTechIconsProps {
  primaryTech: string;
  language: string;
  cardBackgroundClass?: string;
  size?: 'md' | 'lg';
}

export function NestedTechIcons({
  primaryTech,
  language,
  cardBackgroundClass = 'border-syntax-border bg-syntax-card',
  size = 'md',
}: NestedTechIconsProps): ReactElement {
  const showNestedLanguage = shouldNestLanguageIcon(primaryTech, language);
  const primarySize = size === 'lg' ? 'xl' : 'lg';
  const nestedSize = size === 'lg' ? 'sm' : 'xs';
  const nestedClass =
    size === 'lg'
      ? 'absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center'
      : 'absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center';

  if (!showNestedLanguage) {
    return (
      <div className="relative flex-shrink-0">
        <TechIcon className="rounded-lg" size={primarySize} tech={primaryTech} />
      </div>
    );
  }

  return (
    <div className="relative flex-shrink-0">
      <TechIcon className="rounded-lg" size={primarySize} tech={primaryTech} />
      <div
        className={`${nestedClass} overflow-hidden rounded-full border-2 ${cardBackgroundClass}`}
      >
        <TechIcon size={nestedSize} tech={language} variant="language" />
      </div>
    </div>
  );
}
