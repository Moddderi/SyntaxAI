import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SidePanel } from './SidePanel';
import { applyTheme, getTheme } from '../storage/themeStorage';
import '../styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

void getTheme().then(applyTheme);

createRoot(rootElement).render(
  <StrictMode>
    <SidePanel />
  </StrictMode>,
);
