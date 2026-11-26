import React, { useState } from 'react';
import { Plus, Scale } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useIkanara } from '../context/IkanaraContext';
import {
  formatDateID,
  formatKg,
  formatNumber,
  formatRupiah,
} from '../domain/calculations';

export function HarvestPage() {
  const { role, state, mutate } = useIkanara();

  const [modalOpen, setModalOpen] = useState(false);
  const [pondId, setPondId] = useState(state.ponds[0]?.id ?? 'KLM-01');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().slice(0, 10));
  const [fishCount, setFishCount] = useState('25');
  const [totalWeightKg, setTotalWeightKg] = useState('12');
  const [pricePerKg, setPricePerKg] = useState('25000');
  const [buyerName, setBuyerName] = useState('Pembeli Pasar Induk');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedPond = state.ponds.find((p) => p.id === pondId);
  const totalHarvestedWeight = state.harvestRecords.reduce((s, r) => s + r.totalWeightKg, 0);
  const totalHarvestRevenue = state.harvestRecords.reduce((s, r) => s + r.totalRevenue, 0);
  const totalReadyFish = state.ponds.reduce((s, p) => s + p.sizeDistribution.siapPanen, 0);

  const previewRevenue = Math.round(Number(totalWeightKg || 0) * Number(pricePerKg || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'RECORD_HARVEST',
        payload: {
          pondId,
          harvestDate,
          fishCount: Number(fishCount),
          totalWeightKg: Number(totalWeightKg),
          pricePerKg: Number(pricePerKg),
          buyerName,
          notes,
        },
      },
      'Panen dicatat. Populasi kolam, penjualan, dan keuangan diperbarui otomatis.'
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
            Manajemen Panen
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pencatatan panen otomatis mengurangi populasi kolam, memperbarui stok siap panen, dan menghubungkan hasil ke Penjualan & Keuangan tanpa pencatatan ganda.
          </p>
        </div>

        {role === 'admin' && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Catat Hasil Panen
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ikan Siap Panen Saat Ini</span>
            <Scale className="h-4 w-4 text-sky-700" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-emerald-700">
            {formatNumber(totalReadyFish)} ekor
          </p>
          <p className="mt-1 text-xs text-slate-500">Dari seluruh kolam aktif</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Total Berat Panen Tercatat</p>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-slate-900">
            {formatKg(totalHarvestedWeight)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {state.harvestRecords.length} kali panen tersimpan
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Total Nilai Penjualan Panen</p>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-slate-900">
            {formatRupiah(totalHarvestRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Otomatis tersinkron ke Keuangan</p>
        </div>
      </div>

      {/* Harvest Records Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Riwayat Catatan Panen</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">ID Panen</th>
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Kolam / Ikan</th>
                <th className="px-5 py-3 font-medium text-right">Jumlah</th>
                <th className="px-5 py-3 font-medium text-right">Berat Total</th>
                <th className="px-5 py-3 font-medium text-right">Harga / kg</th>
                <th className="px-5 py-3 font-medium text-right">Total Hasil</th>
                <th className="px-5 py-3 font-medium">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.harvestRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Belum ada catatan panen penuh/parsial. Klik "Catat Hasil Panen" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                state.harvestRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono-num font-medium text-slate-700">
                      {rec.id}
                    </td>
                    <td className="px-5 py-3 font-mono-num text-slate-600">
                      {formatDateID(rec.harvestDate)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {rec.pondId} · {rec.species}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-900">
                      {formatNumber(rec.fishCount)} ekor
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num font-semibold text-slate-900">
                      {formatKg(rec.totalWeightKg)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-600">
                      {formatRupiah(rec.pricePerKg)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num font-bold text-emerald-700">
                      {formatRupiah(rec.totalRevenue)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {rec.notes || `Terhubung ke ${rec.linkedSaleId}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Catat Hasil Panen Kolam"
        subtitle="Sistem otomatis membuat transaksi Penjualan & Pemasukan Keuangan tanpa duplikasi."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kolam Asal
              </label>
              <select
                value={pondId}
                onChange={(e) => setPondId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species} · Sisa {p.currentPopulation} ekor)
                  </option>
                ))}
              </select>
              {selectedPond && (
                <p className="mt-1 text-[11px] text-slate-500 font-mono-num">
                  Siap panen: {selectedPond.sizeDistribution.siapPanen} ekor
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Panen
              </label>
              <input
                type="date"
                required
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jumlah (ekor)
              </label>
              <input
                type="number"
                min="1"
                required
                value={fishCount}
                onChange={(e) => setFishCount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Berat Total (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={totalWeightKg}
                onChange={(e) => setTotalWeightKg(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Harga / kg (Rp)
              </label>
              <input
                type="number"
                min="1000"
                required
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between text-xs">
            <span className="text-slate-600">Estimasi Total Penjualan Panen</span>
            <span className="text-base font-bold font-mono-num text-emerald-700">
              {formatRupiah(previewRevenue)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pembeli / Pengepul
            </label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Keterangan Panen
            </label>
            <input
              type="text"
              placeholder="Misal: Panen parsial ukuran konsumsi"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

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
              {submitting ? 'Menyimpan...' : 'Simpan Hasil Panen'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
