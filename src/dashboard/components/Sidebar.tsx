import type { ReactElement } from 'react';
import { Logo } from '../../components/Logo';
import { TechIcon } from '../../components/TechIcon';
import {
  LANGUAGE_NAV_ITEMS,
  LIBRARY_NAV_ITEMS,
} from '../data/mockDashboardData';
import { SettingsIcon } from './icons';

export function Sidebar(): ReactElement {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#1c1c20] bg-[#0d0d0f] px-4 py-5">
      <div className="mb-8 flex items-center gap-3 px-2">
        <Logo className="h-9 w-9" />
        <div>
          <h1 className="text-sm font-semibold text-white">SyntaxAI</h1>
          <p className="text-[11px] text-gray-400">Developer notebook</p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          Library
        </h2>
        <nav className="flex flex-col gap-1">
          {LIBRARY_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                item.isActive
                  ? 'bg-[#141417] text-white'
                  : 'text-gray-400 hover:bg-[#141417]/60 hover:text-white'
              }`}
              type="button"
            >
              <span>{item.label}</span>
              {item.count !== undefined ? (
                <span className="text-xs text-gray-500">{item.count}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </section>

      <section className="mb-6 flex-1">
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Languages
          </h2>
          <button
            className="text-sm text-gray-400 transition hover:text-[#00eaff]"
            type="button"
          >
            +
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {LANGUAGE_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-gray-400 transition hover:bg-[#141417]/60 hover:text-white"
              type="button"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <TechIcon size="sm" tech={item.tech} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-xs text-gray-500">{item.count}</span>
            </button>
          ))}
        </nav>
      </section>

      <section className="border-t border-[#1c1c20] pt-4">
        <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          Account
        </h2>
        <button
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-400 transition hover:bg-[#141417]/60 hover:text-white"
          type="button"
        >
          <SettingsIcon />
          Settings
        </button>
      </section>
    </aside>
  );
}
