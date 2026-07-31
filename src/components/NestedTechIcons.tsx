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
  cardBackgroundClass = 'border-[#141417] bg-[#141417]',
  size = 'md',
}: NestedTechIconsProps): ReactElement {
  const showNestedLanguage = shouldNestLanguageIcon(primaryTech, language);
  const primarySize = size === 'lg' ? 'xl' : 'lg';
  const nestedSize = size === 'lg' ? 'sm' : 'xs';
  const nestedOffset = size === 'lg' ? 'bottom-[-8px] right-[-8px]' : 'bottom-[-6px] right-[-6px]';

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
        className={`absolute ${nestedOffset} overflow-hidden rounded-full border-2 ${cardBackgroundClass}`}
      >
        <TechIcon size={nestedSize} tech={language} variant="language" />
      </div>
    </div>
  );
}
