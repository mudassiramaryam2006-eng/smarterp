'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Central shortcut map. Each handler receives the router and current company
// context so pages don't need to re-wire navigation shortcuts individually.
// Voucher/master shortcuts route to the relevant screen; screen-local actions
// (e.g. saving a form) are handled by the page itself via the `onLocalKey`
// callback so this hook stays a single source of truth for navigation.
export function useKeyboardShortcuts(ctx, onLocalKey) {
  const router = useRouter();

  useEffect(() => {
    function handler(e) {
      // Let the active page intercept first (e.g. Enter to submit a row).
      if (onLocalKey && onLocalKey(e) === true) return;

      const cid = ctx.companyId;
      const go = (path) => {
        e.preventDefault();
        router.push(path);
      };

      // Ignore shortcuts while typing in a text field, except ESC and Ctrl combos
      const target = e.target;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      // ---- Global ----
      if (e.key === 'F1') return go('/companies');
      if (e.key === 'Escape') { e.preventDefault(); router.back(); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'q') return go('/login');
      if (e.ctrlKey && e.key.toLowerCase() === 'h' && cid) return go(`/dashboard/${cid}`);

      if (isTyping) return; // remaining shortcuts are safe only outside text fields

      if (!cid) return;

      // ---- Vouchers ----
      if (e.key === 'F8') return go(`/dashboard/${cid}/vouchers/sales`);
      if (e.key === 'F9') return go(`/dashboard/${cid}/vouchers/purchase`);

      // ---- Masters ----
      if (e.altKey && e.key.toLowerCase() === 'l') return go(`/dashboard/${cid}/masters/ledgers/customers`);
      if (e.altKey && e.key.toLowerCase() === 's') return go(`/dashboard/${cid}/masters/stock-items`);

      // ---- Customer / Supplier ----
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'c')
        return go(`/dashboard/${cid}/masters/ledgers/customers`);
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 's')
        return go(`/dashboard/${cid}/masters/ledgers/suppliers`);
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ctx.companyId, router, onLocalKey]);
}
