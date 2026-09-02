'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, Label, Select } from '@/components/ui/card';
import { KeyBar } from '@/components/layout/KeyBar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { api, invoicePdfUrl } from '@/lib/api';

const emptyLine = { stockItemId: '', quantity: '1', rate: '0', gstPercent: '18' };

export function VoucherFormView({ kind, title, shortcutLabel }) {
  const params = useParams();
  const companyId = params.companyId;
  useKeyboardShortcuts({ companyId });

  const partyType = kind === 'sales' ? 'CUSTOMER' : 'SUPPLIER';
  const [parties, setParties] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [partyId, setPartyId] = useState('');
  const [narration, setNarration] = useState('');
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/companies/${companyId}/ledgers?type=${partyType}`).then(setParties);
    api.get(`/companies/${companyId}/stock-items`).then(setStockItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  function updateLine(idx, patch) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { ...emptyLine }]);
  }

  function removeLine(idx) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function onStockPick(idx, stockItemId) {
    const item = stockItems.find((s) => s.id === stockItemId);
    updateLine(idx, {
      stockItemId,
      rate: item ? (kind === 'sales' ? item.sellingPrice : item.purchasePrice) : '0',
      gstPercent: item ? item.gstPercent : '18',
    });
  }

  const subTotal = lines.reduce((sum, l) => sum + Number(l.quantity || 0) * Number(l.rate || 0), 0);
  const gstTotal = lines.reduce(
    (sum, l) => sum + (Number(l.quantity || 0) * Number(l.rate || 0) * Number(l.gstPercent || 0)) / 100,
    0
  );
  const grandTotal = subTotal + gstTotal;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        [partyType === 'CUSTOMER' ? 'customerId' : 'supplierId']: partyId,
        narration,
        items: lines.map((l) => ({
          stockItemId: l.stockItemId,
          quantity: Number(l.quantity),
          rate: Number(l.rate),
          gstPercent: Number(l.gstPercent),
        })),
      };
      const voucher = await api.post(`/companies/${companyId}/vouchers/${kind}`, payload);
      setSaved(voucher);
      setPartyId('');
      setNarration('');
      setLines([{ ...emptyLine }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <span className="rounded-sm bg-amber px-2 py-1 font-mono text-xs font-bold text-console-bg">
          {shortcutLabel}
        </span>
      </div>

      {saved && (
        <Card className="mb-6 flex items-center justify-between border-success/40 bg-success/10 p-4">
          <p className="text-sm text-success">
            Voucher <strong>{saved.voucherNo}</strong> saved. Grand total Rs. {Number(saved.grandTotal).toFixed(2)}.
          </p>
          <a
            href={invoicePdfUrl(companyId, saved.id)}
            className="rounded-sm border border-success/40 px-3 py-1.5 text-xs text-success hover:bg-success/20"
          >
            Download PDF
          </a>
        </Card>
      )}

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="party">{partyType === 'CUSTOMER' ? 'Customer' : 'Supplier'}</Label>
              <Select id="party" required value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">Select…</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="narration">Narration</Label>
              <Input id="narration" value={narration} onChange={(e) => setNarration(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="mb-2 grid grid-cols-12 gap-2 px-1 text-xs uppercase text-console-muted">
              <span className="col-span-5">Item</span>
              <span className="col-span-2">Qty</span>
              <span className="col-span-2">Rate</span>
              <span className="col-span-2">GST %</span>
              <span className="col-span-1"></span>
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="mb-2 grid grid-cols-12 gap-2">
                <Select
                  className="col-span-5"
                  required
                  value={line.stockItemId}
                  onChange={(e) => onStockPick(idx, e.target.value)}
                >
                  <option value="">Select item…</option>
                  {stockItems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.sku}) — stock {s.quantity}
                    </option>
                  ))}
                </Select>
                <Input
                  className="col-span-2"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={line.rate}
                  onChange={(e) => updateLine(idx, { rate: e.target.value })}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.gstPercent}
                  onChange={(e) => updateLine(idx, { gstPercent: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  disabled={lines.length === 1}
                  className="col-span-1 text-xs text-danger disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addLine}>
              + Add line
            </Button>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-1 font-mono text-sm">
              <div className="flex justify-between text-console-muted">
                <span>Sub total</span>
                <span>Rs. {subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-console-muted">
                <span>GST total</span>
                <span>Rs. {gstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-console-border pt-1 text-base font-semibold">
                <span>Grand total</span>
                <span>Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save voucher'}
          </Button>
        </form>
      </Card>

      <KeyBar companyId={companyId} />
    </main>
  );
}
