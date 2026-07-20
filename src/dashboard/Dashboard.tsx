import type { ReactElement } from 'react';
import { DashboardTopBar } from './components/DashboardTopBar';
import { FloatingBar } from './components/FloatingBar';
import { Sidebar } from './components/Sidebar';
import { SnippetGrid } from './components/SnippetGrid';
import { StatsGrid } from './components/StatsGrid';

export function Dashboard(): ReactElement {
  return (
    <div className="flex min-h-screen bg-[#0d0d0f] text-white">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto px-6 py-6 pb-28">
          <DashboardTopBar />
          <StatsGrid />
          <SnippetGrid />
        </main>
      </div>

      <FloatingBar />
    </div>
  );
}
