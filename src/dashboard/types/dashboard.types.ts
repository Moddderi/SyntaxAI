export interface LibraryNavItem {
  id: string;
  label: string;
  count?: number;
  isActive?: boolean;
}

export interface TechnologyNavItem {
  id: string;
  label: string;
  tech: string;
  count: number;
}

/** @deprecated Use TechnologyNavItem */
export type LanguageNavItem = TechnologyNavItem;

export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  hint: string;
}

export interface SnippetItem {
  id: string;
  title: string;
  primaryTech: string;
  language: string;
  code: string;
  updatedAt: string;
  codePreview: string;
  topics: string[];
  isStarred: boolean;
}

export type SnippetViewMode = 'grid' | 'list';

export type LibraryTabId =
  | 'all'
  | 'starred'
  | 'recent'
  | 'analytics'
  | 'trash';
