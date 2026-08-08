import { useEffect, useRef, useState, type ReactElement } from 'react';
import { NestedTechIcons } from './NestedTechIcons';

interface TechDetectionIndicatorProps {
  primaryTech: string | null;
  language: string | null;
  isAnalyzing: boolean;
  isConfirmed?: boolean;
  size?: 'md' | 'lg';
  cardBackgroundClass?: string;
}

function ScanningPlaceholder({ size }: { size: 'md' | 'lg' }): ReactElement {
  const boxSize = size === 'lg' ? 'h-[3.75rem] w-[3.75rem]' : 'h-10 w-10';

  return (
    <div
      aria-hidden="true"
      className={`relative flex ${boxSize} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1c1c20] bg-[#0d0d0f]`}
    >
      <div className="absolute inset-0 animate-tech-shimmer bg-gradient-to-r from-transparent via-[#00eaff]/10 to-transparent" />
      <div className="h-5 w-5 animate-tech-pulse rounded-md border border-[#00eaff]/30 bg-[#00eaff]/10" />
    </div>
  );
}

export function TechDetectionIndicator({
  primaryTech,
  language,
  isAnalyzing,
  isConfirmed = false,
  size = 'md',
  cardBackgroundClass = 'border-[#141417] bg-[#141417]',
}: TechDetectionIndicatorProps): ReactElement {
  const [displayTech, setDisplayTech] = useState<{ primaryTech: string; language: string } | null>(
    null,
  );
  const previousTechRef = useRef<string | null>(null);

  useEffect(() => {
    if (!primaryTech || !language) {
      if (!isAnalyzing) {
        setDisplayTech(null);
      }
      return;
    }

    const techKey = `${primaryTech}::${language}`;

    if (isAnalyzing) {
      setDisplayTech({ primaryTech, language });
      return;
    }

    if (previousTechRef.current !== techKey) {
      previousTechRef.current = techKey;
    }

    setDisplayTech({ primaryTech, language });
  }, [isAnalyzing, language, primaryTech]);

  if (isAnalyzing && !displayTech) {
    return <ScanningPlaceholder size={size} />;
  }

  if (isAnalyzing && displayTech) {
    return (
      <div className="relative shrink-0">
        <div
          aria-hidden="true"
          className={`absolute -inset-1 animate-tech-scan rounded-2xl border border-[#00eaff]/40`}
        />
        <div className="relative opacity-50 grayscale-[0.2]">
          <NestedTechIcons
            cardBackgroundClass={cardBackgroundClass}
            language={displayTech.language}
            primaryTech={displayTech.primaryTech}
            size={size}
          />
        </div>
      </div>
    );
  }

  if (displayTech) {
    return (
      <div
        className={`shrink-0 ${isConfirmed ? 'animate-tech-reveal' : 'animate-fade-in'}`}
        key={`${displayTech.primaryTech}-${displayTech.language}`}
      >
        <NestedTechIcons
          cardBackgroundClass={cardBackgroundClass}
          language={displayTech.language}
          primaryTech={displayTech.primaryTech}
          size={size}
        />
      </div>
    );
  }

  return <ScanningPlaceholder size={size} />;
}

interface DetectionStatusProps {
  isAnalyzing: boolean;
  isConfirmed?: boolean;
  label?: string;
}

export function DetectionStatus({
  isAnalyzing,
  isConfirmed = false,
  label = 'Analyzing…',
}: DetectionStatusProps): ReactElement | null {
  if (!isAnalyzing && isConfirmed) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-[#00eaff] animate-fade-in">
        <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[#00eaff]" />
        Detected
      </div>
    );
  }

  if (!isAnalyzing) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-[10px] text-gray-400">
      <div
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-[#1c1c20] border-t-[#00eaff]"
      />
      {label}
    </div>
  );
}
