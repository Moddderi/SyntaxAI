import { useEffect, useMemo, useState } from 'react';
import type { ReactElement, SyntheticEvent } from 'react';
import { getDeviconUrlCandidates, getTechAbbreviation } from '../utils/techIcon';

type TechIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface TechIconProps {
  tech: string;
  className?: string;
  size?: TechIconSize;
  /** When set, uses language-specific Devicon slug resolution (typescript, python, etc.). */
  variant?: 'default' | 'language';
}

const SIZE_CLASSES: Record<TechIconSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-[3.75rem] w-[3.75rem]',
};

const FALLBACK_TEXT_CLASSES: Record<TechIconSize, string> = {
  xs: 'text-[8px]',
  sm: 'text-[9px]',
  md: 'text-[10px]',
  lg: 'text-[11px]',
  xl: 'text-sm',
};

export function TechIcon({
  tech,
  className = '',
  size = 'md',
  variant = 'default',
}: TechIconProps): ReactElement {
  const iconUrls = useMemo(
    () => getDeviconUrlCandidates(tech, variant),
    [tech, variant],
  );
  const [urlIndex, setUrlIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);
  const abbreviation = getTechAbbreviation(tech);
  const iconUrl = iconUrls[urlIndex];

  useEffect(() => {
    setUrlIndex(0);
    setHasFailedAll(false);
  }, [tech, variant]);

  const handleError = (event: SyntheticEvent<HTMLImageElement>): void => {
    event.currentTarget.onerror = null;

    if (urlIndex < iconUrls.length - 1) {
      setUrlIndex((current) => current + 1);
      return;
    }

    setHasFailedAll(true);
  };

  if (hasFailedAll || !iconUrl) {
    return (
      <span
        aria-label={`${tech} icon fallback`}
        className={`inline-flex shrink-0 items-center justify-center font-bold text-syntax-accent ${SIZE_CLASSES[size]} ${FALLBACK_TEXT_CLASSES[size]} ${className}`}
      >
        {abbreviation}
      </span>
    );
  }

  return (
    <img
      alt={`${tech} icon`}
      className={`shrink-0 object-contain ${SIZE_CLASSES[size]} ${className}`}
      draggable={false}
      onError={handleError}
      src={iconUrl}
    />
  );
}
