import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useIkanara } from '../context/IkanaraContext';
import {
  computeDashboardMetrics,
  FISH_SPECIES_LIST,
  formatDateID,
  formatNumber,
  formatRupiah,
} from '../domain/calculations';
import type { FishSpecies } from '../domain/types';

export function SeedsPage() {
  const { role, state, mutate } = useIkanara();
  const m = computeDashboardMetrics(state);

  const [modalOpen, setModalOpen] = useState(false);
  const [pondId, setPondId] = useState(state.ponds[0]?.id ?? 'KLM-01');
  const [species, setSpecies] = useState<FishSpecies>(state.ponds[0]?.species ?? 'Lele');
  const [quantity, setQuantity] = useState('100');
  const [purchaseCost, setPurchaseCost] = useState('150000');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [stockingDate, setStockingDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplier, setSupplier] = useState('Balai Benih Mandiri');
  const [notes, setNotes] = useState('');
  const [recordExpense, setRecordExpense] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const totalSeedsStocked = state.seedBatches.reduce((sum, b) => sum + b.quantity, 0);

  const handlePondChange = (nextPondId: string) => {
    setPondId(nextPondId);
    const matched = state.ponds.find((p) => p.id === nextPondId);
    if (matched) setSpecies(matched.species);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'ADD_SEED_BATCH',
        payload: {
          pondId,
          species,
          quantity: Number(quantity),
          purchaseCost: Number(purchaseCost),
          purchaseDate,
          stockingDate,
          supplier,
          notes,
          recordExpense,
        },
      },
      'Pembelian & penebaran bibit berhasil dicatat'
    );
    setSubmitting(false);
    if (ok) {
      setModalOpen(false);
      setNotes('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Data Bibit
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pencatatan pembelian benih, biaya, pemasok, tanggal penebaran, dan pembaruan populasi kolam otomatis.
          </p>
        </div>

        {role === 'admin' && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Catat Pembelian & Tebar Bibit
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Total Bibit Ditebar</p>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-slate-900">
            {formatNumber(totalSeedsStocked)} ekor
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {state.seedBatches.length} gelombang penebaran tercatat
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Total Biaya Pembelian Bibit</p>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-slate-900">
            {formatRupiah(m.totalSeedCost)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Alokasi anggaran benih Rp1.500.000</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Cadangan Pembelian Bibit</p>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-sky-700">
            {formatRupiah(m.seedReserveRemaining)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Sisa anggaran benih tersedia</p>
        </div>
      </div>

      {/* Stocking History Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Riwayat Penebaran Bibit</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Tgl Beli / Tebar</th>
                <th className="px-5 py-3 font-medium">Kolam Tujuan</th>
                <th className="px-5 py-3 font-medium">Jenis Ikan</th>
                <th className="px-5 py-3 font-medium text-right">Jumlah</th>
                <th className="px-5 py-3 font-medium text-right">Biaya</th>
                <th className="px-5 py-3 font-medium">Pemasok & Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.seedBatches.map((batch) => {
                const pond = state.ponds.find((p) => p.id === batch.pondId);
                return (
                  <tr key={batch.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono-num font-medium text-slate-700">
                      {batch.id}
                    </td>
                    <td className="px-5 py-3 font-mono-num text-slate-600">
                      {formatDateID(batch.stockingDate)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {pond ? `${pond.name} (${pond.id})` : batch.pondId}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{batch.species}</td>
                    <td className="px-5 py-3 text-right font-mono-num font-semibold text-slate-900">
                      {formatNumber(batch.quantity)} ekor
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-900">
                      {formatRupiah(batch.purchaseCost)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <span className="font-medium text-slate-800">{batch.supplier}</span>
                      {batch.notes ? ` · ${batch.notes}` : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Catat Pembelian & Penebaran Bibit"
        subtitle="Jumlah bibit akan langsung menambah populasi kolam tujuan."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kolam Tujuan
              </label>
              <select
                value={pondId}
                onChange={(e) => handlePondChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id} · {p.species})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jenis Ikan
              </label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as FishSpecies)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {FISH_SPECIES_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jumlah Bibit (ekor)
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Harga Pembelian (Rp)
              </label>
              <input
                type="number"
                min="0"
                required
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Pembelian
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Penebaran
              </label>
              <input
                type="date"
                required
                value={stockingDate}
                onChange={(e) => setStockingDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pemasok / Hatchery
            </label>
            <input
              type="text"
              required
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan Penebaran
            </label>
            <input
              type="text"
              placeholder="Misal: Ukuran tebar 7–9 cm, aklimatisasi 20 menit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={recordExpense}
              onChange={(e) => setRecordExpense(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Catat otomatis sebagai pengeluaran pembelian bibit di Keuangan</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Data Bibit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
