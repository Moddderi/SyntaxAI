import { DEVICON_VARIANTS } from './deviconIndex';
import { getTechDef, resolveTechSlug } from './techCatalog';

const DEVICON_BASE_URL = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';
const DEVICON_VARIANT_FALLBACKS = ['original', 'plain', 'original-wordmark', 'plain-wordmark', 'line'];

/** Canonical slug for any tech name, alias or label ("Next.js", "ts", "c++"). */
export function resolveDeviconSlug(tech: string): string {
  return resolveTechSlug(tech);
}

export function resolveLanguageDeviconSlug(language: string): string {
  return resolveTechSlug(language);
}

export function shouldNestLanguageIcon(primaryTech: string, language: string): boolean {
  return resolveDeviconSlug(primaryTech) !== resolveDeviconSlug(language);
}

function buildDeviconUrl_(folder: string, variant: string): string {
  return `${DEVICON_BASE_URL}/${folder}/${folder}-${variant}.svg`;
}

/**
 * Ordered icon URLs to try. Custom icons first, then the Devicon variant that is
 * known to exist. An empty list means "no icon" -> the UI shows the abbreviation tile.
 */
export function getDeviconUrlCandidates(
  tech: string,
  variant: 'default' | 'language' = 'default',
): string[] {
  const slug = variant === 'language' ? resolveLanguageDeviconSlug(tech) : resolveDeviconSlug(tech);
  const def = getTechDef(slug);
  const folder = def?.icon ?? slug;
  const urls: string[] = [...(def?.iconUrls ?? [])];
  const knownVariant = DEVICON_VARIANTS[folder];

  if (knownVariant) {
    urls.push(buildDeviconUrl_(folder, knownVariant));
    return urls;
  }

  // Unknown to the index (brand-new Devicon icon or custom slug): probe the common variants.
  if (!def && folder) {
    DEVICON_VARIANT_FALLBACKS.slice(0, 2).forEach((fallback) => {
      urls.push(buildDeviconUrl_(folder, fallback));
    });
  }

  return urls;
}

export function buildDeviconUrl(tech: string): string {
  return getDeviconUrlCandidates(tech)[0] ?? '';
}

export function buildLanguageDeviconUrl(language: string): string {
  return getDeviconUrlCandidates(language, 'language')[0] ?? '';
}

export function getTechAbbreviation(tech: string): string {
  const def = getTechDef(tech);

  if (def?.abbr) {
    return def.abbr;
  }

  const alnum = (def?.label ?? tech).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return alnum.slice(0, 3) || 'TEC';
}

export function formatTechnologyLabel(slug: string): string {
  const def = getTechDef(slug);

  if (def) {
    return def.label;
  }

  const trimmed = slug.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : '';
}

function hashSlugToColor(slug: string): string {
  let hash = 0;

  for (let index = 0; index < slug.length; index += 1) {
    hash = slug.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 52%)`;
}

/** Official / recognizable brand colors for stack analytics (pie chart, bars). */
export function getTechBrandColor(tech: string): string {
  const def = getTechDef(tech);
  return def?.color ?? hashSlugToColor(resolveDeviconSlug(tech));
}
