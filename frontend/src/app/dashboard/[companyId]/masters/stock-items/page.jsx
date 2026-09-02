'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, Label } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { KeyBar } from '@/components/layout/KeyBar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { api } from '@/lib/api';

const emptyForm = {
  name: '',
  sku: '',
  purchasePrice: '0',
  sellingPrice: '0',
  quantity: '0',
  gstPercent: '18',
  hsnCode: '',
};

export default function StockItemsPage() {
  const params = useParams();
  const companyId = params.companyId;
  useKeyboardShortcuts({ companyId });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const data = await api.get(`/companies/${companyId}/stock-items`);
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...form,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        quantity: Number(form.quantity),
        gstPercent: Number(form.gstPercent),
      };
      if (editingId) {
        await api.put(`/companies/${companyId}/stock-items/${editingId}`, payload);
      } else {
        await api.post(`/companies/${companyId}/stock-items`, payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this stock item?')) return;
    await api.delete(`/companies/${companyId}/stock-items/${id}`);
    load();
  }

  const columns = [
    { accessorKey: 'name', header: 'Item' },
    { accessorKey: 'sku', header: 'SKU' },
    {
      accessorKey: 'purchasePrice',
      header: 'Purchase Rate',
      cell: ({ row }) => `Rs. ${Number(row.original.purchasePrice).toFixed(2)}`,
    },
    {
      accessorKey: 'sellingPrice',
      header: 'Selling Rate',
      cell: ({ row }) => `Rs. ${Number(row.original.sellingPrice).toFixed(2)}`,
    },
    { accessorKey: 'quantity', header: 'Qty' },
    {
      accessorKey: 'gstPercent',
      header: 'GST %',
      cell: ({ row }) => `${Number(row.original.gstPercent)}%`,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingId(row.original.id);
              setForm({
                name: row.original.name,
                sku: row.original.sku,
                purchasePrice: String(row.original.purchasePrice),
                sellingPrice: String(row.original.sellingPrice),
                quantity: String(row.original.quantity),
                gstPercent: String(row.original.gstPercent),
                hsnCode: row.original.hsnCode || '',
              });
              setShowForm(true);
            }}
          >
            Alter
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.original.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Stock Items</h1>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowForm(!showForm);
          }}
        >
          + Create Stock Item
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">Item name</Label>
              <Input id="name" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pp">Purchase price</Label>
              <Input
                id="pp"
                type="number"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sp">Selling price</Label>
              <Input
                id="sp"
                type="number"
                step="0.01"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="qty">Opening quantity</Label>
              <Input
                id="qty"
                type="number"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gst">GST %</Label>
              <Input
                id="gst"
                type="number"
                step="0.01"
                value={form.gstPercent}
                onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hsn">HSN code</Label>
              <Input id="hsn" value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} />
            </div>
            {error && <p className="col-span-3 text-sm text-danger">{error}</p>}
            <div className="col-span-3">
              <Button type="submit">{editingId ? 'Save changes' : 'Create'}</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-console-muted">Loading…</p>
      ) : (
        <DataTable columns={columns} data={rows} emptyLabel="No stock items yet." />
      )}

      <KeyBar companyId={companyId} />
    </main>
  );
}
