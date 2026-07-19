import type { ReactElement } from 'react';
import { Logo } from '../components/Logo';

export function Dashboard(): ReactElement {
  return (
    <main className="min-h-screen bg-syntax-bg px-6 py-10">
      <section className="mx-auto max-w-5xl rounded-2xl border border-syntax-border bg-syntax-card p-10">
        <div className="mb-6 flex items-center gap-3">
          <Logo className="h-10 w-10" />

          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
            Full Workspace
          </p>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-white">
          SyntaxAI Comprehensive Dashboard
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400">
          Manage notes, technology stacks, and AI-powered captures from a
          spacious browser tab designed for deep work.
        </p>
      </section>
    </main>
  );
}
