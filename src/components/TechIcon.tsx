import { useEffect, useState } from 'react';
import type { ReactElement, SyntheticEvent } from 'react';
import { buildDeviconUrl, getTechAbbreviation } from '../utils/techIcon';

type TechIconSize = 'sm' | 'md';

interface TechIconProps {
  tech: string;
  className?: string;
  size?: TechIconSize;
}

const SIZE_CLASSES: Record<TechIconSize, string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
};

const FALLBACK_TEXT_CLASSES: Record<TechIconSize, string> = {
  sm: 'text-[9px]',
  md: 'text-[10px]',
};

export function TechIcon({
  tech,
  className = '',
  size = 'md',
}: TechIconProps): ReactElement {
  const [isError, setIsError] = useState(false);
  const abbreviation = getTechAbbreviation(tech);
  const iconUrl = buildDeviconUrl(tech);

  useEffect(() => {
    setIsError(false);
  }, [tech]);

  const handleError = (event: SyntheticEvent<HTMLImageElement>): void => {
    event.currentTarget.onerror = null;
    setIsError(true);
  };

  if (isError) {
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
