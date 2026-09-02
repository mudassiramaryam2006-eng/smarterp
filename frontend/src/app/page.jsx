'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { KeyBar } from '@/components/layout/KeyBar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Card } from '@/components/ui/card';

const MENU = [
  {
    title: 'Masters',
    items: [
      { label: 'Customer Ledger', href: 'masters/ledgers/customers', shortcut: 'CTRL+C' },
      { label: 'Supplier Ledger', href: 'masters/ledgers/suppliers', shortcut: 'CTRL+S' },
      { label: 'Stock Items', href: 'masters/stock-items', shortcut: 'ALT+S' },
    ],
  },
  {
    title: 'Transactions',
    items: [
      { label: 'Sales Voucher', href: 'vouchers/sales', shortcut: 'F8' },
      { label: 'Purchase Voucher', href: 'vouchers/purchase', shortcut: 'F9' },
    ],
  },
  {
    title: 'Coming soon',
    items: [
      { label: 'Inventory', href: '#', shortcut: 'CTRL+I' },
      { label: 'Accounting', href: '#', shortcut: '—' },
      { label: 'Banking', href: '#', shortcut: '—' },
      { label: 'Payroll', href: '#', shortcut: '—' },
      { label: 'GST', href: '#', shortcut: 'ALT+X' },
      { label: 'Reports', href: '#', shortcut: 'ALT+B' },
      { label: 'Utilities', href: '#', shortcut: '—' },
      { label: 'Administration', href: '#', shortcut: '—' },
    ],
  },
];

export default function GatewayPage() {
  const params = useParams();
  const companyId = params.companyId;
  useKeyboardShortcuts({ companyId });

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 pb-24">
      <h1 className="font-display text-3xl font-bold">
        Gateway of Smart<span className="text-amber">ERP</span>
      </h1>
      <p className="mb-8 text-sm text-console-muted">
        Use the shortcuts below, or the function-key bar at the bottom of the screen.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {MENU.map((section) => (
          <Card key={section.title} className="p-5">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-cyan">
              {section.title}
            </h2>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href === '#' ? '#' : `/dashboard/${companyId}/${item.href}`}
                    className={`flex items-center justify-between rounded-sm px-2 py-1.5 text-sm ${
                      item.href === '#' ? 'cursor-default text-console-muted/50' : 'text-console-text hover:bg-console-panel2'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-[10px] text-console-muted">{item.shortcut}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <KeyBar companyId={companyId} />
    </main>
  );
}
