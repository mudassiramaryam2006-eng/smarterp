'use client';

import { useRouter } from 'next/navigation';

// The one deliberately "loud" element in the app: a persistent bottom strip
// of function keys, styled after Tally's iconic F-key bar but rebuilt as a
// real, clickable, keyboard-navigable console footer.
export function KeyBar({ companyId }) {
  const router = useRouter();

  const keys = [
    { label: 'F1', text: 'Company', path: '/companies' },
    { label: 'F8', text: 'Sales', path: companyId ? `/dashboard/${companyId}/vouchers/sales` : undefined },
    { label: 'F9', text: 'Purchase', path: companyId ? `/dashboard/${companyId}/vouchers/purchase` : undefined },
    { label: 'ALT+L', text: 'Ledger', path: companyId ? `/dashboard/${companyId}/masters/ledgers/customers` : undefined },
    { label: 'ALT+S', text: 'Stock Item', path: companyId ? `/dashboard/${companyId}/masters/stock-items` : undefined },
    { label: 'CTRL+H', text: 'Home', path: companyId ? `/dashboard/${companyId}` : undefined },
    { label: 'ESC', text: 'Back', path: undefined },
    { label: 'CTRL+Q', text: 'Logout', path: '/login' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-console-border bg-console-panel">
      <div className="mx-auto flex max-w-7xl flex-wrap items-stretch">
        {keys.map((k) => (
          <button
            key={k.label}
            onClick={() => (k.path ? router.push(k.path) : router.back())}
            className="group flex flex-1 items-center gap-2 border-r border-console-border px-3 py-2 text-left last:border-r-0 hover:bg-console-panel2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
          >
            <span className="rounded-sm bg-amber px-1.5 py-0.5 font-mono text-[10px] font-bold text-console-bg">
              {k.label}
            </span>
            <span className="text-xs text-console-muted group-hover:text-console-text">{k.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
