import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SidePanel } from './SidePanel';
import { applyTheme, getTheme } from '../storage/themeStorage';
import { applyLocale, getLocale } from '../storage/localeStorage';
import '../styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

void Promise.all([getTheme(), getLocale()]).then(([theme, locale]) => {
  applyTheme(theme);
  applyLocale(locale);
});

createRoot(rootElement).render(
  <StrictMode>
    <SidePanel />
  </StrictMode>,
);
