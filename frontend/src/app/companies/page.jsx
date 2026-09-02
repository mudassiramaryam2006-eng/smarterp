'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, Label } from '@/components/ui/card';
import { api } from '@/lib/api';

const emptyForm = {
  name: '',
  address: '',
  gstNumber: '',
  state: '',
  financialYear: '2026-2027',
  contactPhone: '',
  contactEmail: '',
};

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/companies');
      setCompanies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api.put(`/companies/${editingId}`, form);
      } else {
        await api.post('/companies', form);
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      address: c.address || '',
      gstNumber: c.gstNumber || '',
      state: c.state || '',
      financialYear: c.financialYear,
      contactPhone: c.contactPhone || '',
      contactEmail: c.contactEmail || '',
    });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this company and all its data? This cannot be undone.')) return;
    await api.delete(`/companies/${id}`);
    load();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Company Selection</h1>
          <p className="text-sm text-console-muted">{companies.length} / 5 companies used</p>
        </div>
        {companies.length < 5 && (
          <Button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(!showForm);
            }}
          >
            + Create Company
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gst">GST number</Label>
              <Input id="gst" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fy">Financial year</Label>
              <Input
                id="fy"
                required
                placeholder="2026-2027"
                value={form.financialYear}
                onChange={(e) => setForm({ ...form, financialYear: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Contact phone</Label>
              <Input
                id="phone"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="cemail">Contact email</Label>
              <Input
                id="cemail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
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
        <div className="grid gap-3">
          {companies.map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-console-muted">
                  FY {c.financialYear} {c.state ? `· ${c.state}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => router.push(`/dashboard/${c.id}`)}>
                  Select
                </Button>
                <Button size="sm" variant="secondary" onClick={() => startEdit(c)}>
                  Alter
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
          {companies.length === 0 && (
            <p className="text-console-muted">No companies yet — create your first one above.</p>
          )}
        </div>
      )}
    </main>
  );
}
