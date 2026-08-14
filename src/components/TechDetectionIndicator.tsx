import { useEffect, useRef, useState, type ReactElement } from 'react';
import { NestedTechIcons } from './NestedTechIcons';
import { getTechBrandColor } from '../utils/techIcon';

interface TechDetectionIndicatorProps {
  primaryTech: string | null;
  language: string | null;
  isAnalyzing: boolean;
  isConfirmed?: boolean;
  size?: 'md' | 'lg';
  cardBackgroundClass?: string;
}

const BOX_SIZES: Record<'md' | 'lg', string> = {
  md: 'h-10 w-10',
  lg: 'h-[3.75rem] w-[3.75rem]',
};

interface TechDetectLoaderProps {
  size: 'md' | 'lg';
  accentColor?: string;
}

function TechDetectLoader({ size, accentColor = '#00eaff' }: TechDetectLoaderProps): ReactElement {
  const boxSize = BOX_SIZES[size];

  return (
    <div aria-hidden="true" className={`relative ${boxSize}`}>
      <div
        className="absolute -inset-0.5 animate-tech-orbit rounded-xl"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${accentColor}55 35%, ${accentColor} 50%, transparent 65%)`,
        }}
      />
      <div className="absolute inset-0 rounded-xl border border-syntax-border bg-syntax-inset" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="animate-tech-pulse rounded-full"
          style={{
            width: size === 'lg' ? '10px' : '8px',
            height: size === 'lg' ? '10px' : '8px',
            backgroundColor: accentColor,
            boxShadow: `0 0 12px ${accentColor}88`,
          }}
        />
      </div>
    </div>
  );
}

export function DetectionConfirmedBadge(): ReactElement {
  return (
    <div className="flex animate-fade-in items-center gap-1.5 rounded-full border border-syntax-accent/20 bg-syntax-accent/10 px-2.5 py-1 text-[10px] text-syntax-accent">
      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-syntax-accent" />
      Detected
    </div>
  );
}

export function TechDetectionIndicator({
  primaryTech,
  language,
  isAnalyzing,
  isConfirmed = false,
  size = 'md',
  cardBackgroundClass = 'border-syntax-border bg-syntax-card',
}: TechDetectionIndicatorProps): ReactElement {
  const [displayTech, setDisplayTech] = useState<{ primaryTech: string; language: string } | null>(
    null,
  );
  const previousTechRef = useRef<string | null>(null);
  const boxSize = BOX_SIZES[size];

  useEffect(() => {
    if (!primaryTech || !language) {
      if (!isAnalyzing) {
        setDisplayTech(null);
      }
      return;
    }

    const techKey = `${primaryTech}::${language}`;
    setDisplayTech({ primaryTech, language });

    if (!isAnalyzing && previousTechRef.current !== techKey) {
      previousTechRef.current = techKey;
    }
  }, [isAnalyzing, language, primaryTech]);

  const accentColor = displayTech ? getTechBrandColor(displayTech.primaryTech) : '#00eaff';

  return (
    <div
      aria-busy={isAnalyzing}
      aria-label={isAnalyzing ? 'Detecting technology stack' : undefined}
      className={`relative flex ${boxSize} shrink-0 items-center justify-center`}
    >
      {isAnalyzing ? (
        <TechDetectLoader accentColor={accentColor} size={size} />
      ) : displayTech ? (
        <div className={isConfirmed ? 'animate-tech-reveal' : 'animate-fade-in'}>
          <NestedTechIcons
            cardBackgroundClass={cardBackgroundClass}
            language={displayTech.language}
            primaryTech={displayTech.primaryTech}
            size={size}
          />
        </div>
      ) : (
        <TechDetectLoader size={size} />
      )}
    </div>
  );
}
