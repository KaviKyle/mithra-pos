import { Screen } from "../types";

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  todaySalesCount: number;
  hasReorderItems: boolean;
}

/**
 * Home Screen — the landing page dad sees when he opens the POS.
 * 3 big buttons, reorder banner, today's stats.
 * Designed for quick tap/click — no scrolling needed on 1080p.
 */
export function HomeScreen({ onNavigate, todaySalesCount, hasReorderItems }: HomeScreenProps) {
  const today = new Date().toLocaleDateString("si-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="screen flex flex-col gap-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold tracking-tight">මිත්‍ර POS</h1>
        <p className="text-gray-500 mt-1">{today}</p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-full">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-gray-600">
            අද විකුණුම්: <strong>{todaySalesCount}</strong>
          </span>
          <span className="text-xs text-gray-400">Today: {todaySalesCount} sales</span>
        </div>
      </div>

      {/* Reorder Banner */}
      {hasReorderItems && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-6 h-6 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium text-amber-800">Stock අඩු භාණ්ඩ ඇත</p>
            <span className="si-label !text-amber-700">Some items need reordering. Check Stock screen.</span>
          </div>
          <button
            onClick={() => onNavigate("stock")}
            className="ml-auto px-4 py-2 bg-warning text-white rounded-lg font-medium text-sm active:scale-[0.98]"
          >
            බලන්න
          </button>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-1 gap-4">
        {/* New Sale — Primary */}
        <button
          onClick={() => onNavigate("sell")}
          className="btn-primary !h-28 !text-2xl flex-col gap-1"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>නව විකුණුමක්</span>
          <span className="si-label !text-white/70">New Sale (F1)</span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          {/* Check Stock */}
          <button
            onClick={() => onNavigate("stock")}
            className="btn-primary !h-24 !bg-gray-700 !text-lg flex-col gap-1"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Stock බලන්න</span>
            <span className="si-label !text-white/70">Check Stock (F2)</span>
          </button>

          {/* Day Close */}
          <button
            onClick={() => onNavigate("dayClose")}
            className="btn-primary !h-24 !bg-gray-700 !text-lg flex-col gap-1"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>දිනය අවසන් කරන්න</span>
            <span className="si-label !text-white/70">Day Close (F6)</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Legend */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 justify-center">
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">F1</kbd> New Sale</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">F2</kbd> Stock</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">F3</kbd> Cash</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">F4</kbd> LankaQR</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">F5</kbd> Card</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">F6</kbd> Day Close</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Esc</kbd> Back</span>
        </div>
      </div>
    </div>
  );
}
