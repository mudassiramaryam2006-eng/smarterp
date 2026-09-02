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

const emptyForm = { name: '', mobile: '', address: '', gstNumber: '', openingBalance: '0' };

export function LedgerMasterView({ type, title }) {
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
    const data = await api.get(`/companies/${companyId}/ledgers?type=${type}`);
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
      const payload = { ...form, type, openingBalance: Number(form.openingBalance) || 0 };
      if (editingId) {
        await api.put(`/companies/${companyId}/ledgers/${editingId}`, payload);
      } else {
        await api.post(`/companies/${companyId}/ledgers`, payload);
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
    if (!confirm('Delete this ledger?')) return;
    await api.delete(`/companies/${companyId}/ledgers/${id}`);
    load();
  }

  const columns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'mobile', header: 'Mobile' },
    { accessorKey: 'address', header: 'Address' },
    {
      accessorKey: 'currentBalance',
      header: 'Outstanding',
      cell: ({ row }) => `Rs. ${Number(row.original.currentBalance).toFixed(2)}`,
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
                mobile: row.original.mobile || '',
                address: row.original.address || '',
                gstNumber: row.original.gstNumber || '',
                openingBalance: String(row.original.openingBalance),
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
    <main className="mx-auto max-w-4xl px-4 py-10 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowForm(!showForm);
          }}
        >
          + Create Ledger
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gst">GST number</Label>
              <Input id="gst" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ob">Opening balance</Label>
              <Input
                id="ob"
                type="number"
                step="0.01"
                value={form.openingBalance}
                onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
              />
            </div>
            {error && <p className="col-span-2 text-sm text-danger">{error}</p>}
            <div className="col-span-2">
              <Button type="submit">{editingId ? 'Save changes' : 'Create'}</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-console-muted">Loading…</p>
      ) : (
        <DataTable columns={columns} data={rows} emptyLabel={`No ${title.toLowerCase()} yet.`} />
      )}

      <KeyBar companyId={companyId} />
    </main>
  );
}
