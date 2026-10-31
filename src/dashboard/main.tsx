import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './Dashboard';
import { applyTheme, getTheme } from '../storage/themeStorage';
import { applyLocale, getLocale } from '../storage/localeStorage';
import { hydrateBillingFromSessionCache } from '../services/sessionService';
import '../styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

void Promise.all([getTheme(), getLocale(), hydrateBillingFromSessionCache()]).then(([theme, locale]) => {
  applyTheme(theme);
  applyLocale(locale);
});

createRoot(rootElement).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
);
