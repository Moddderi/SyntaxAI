export interface LibraryNavItem {
  id: string;
  label: string;
  count?: number;
  isActive?: boolean;
}

export interface LanguageNavItem {
  id: string;
  label: string;
  tech: string;
  count: number;
}

export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  hint: string;
}

export interface SnippetItem {
  id: string;
  title: string;
  tech: string;
  updatedAt: string;
  codePreview: string;
  tags: string[];
  isStarred: boolean;
}

export type SnippetViewMode = 'grid' | 'list';

export type LibraryTabId =
  | 'all'
  | 'starred'
  | 'recent'
  | 'analytics'
  | 'tags'
  | 'trash';
