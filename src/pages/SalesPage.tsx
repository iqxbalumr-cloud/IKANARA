import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmModal, Modal } from '../components/Modal';
import { useIkanara } from '../context/IkanaraContext';
import {
  computePeriodFinancials,
  FISH_SPECIES_LIST,
  formatDateID,
  formatKg,
  formatRupiah,
} from '../domain/calculations';
import type { FishSpecies, ReportPeriod } from '../domain/types';

export function SalesPage() {
  const { role, state, mutate } = useIkanara();

  const [period, setPeriod] = useState<ReportPeriod>('bulanan');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [species, setSpecies] = useState<FishSpecies>('Lele');
  const [weightKg, setWeightKg] = useState('10');
  const [pricePerKg, setPricePerKg] = useState('25000');
  const [buyerName, setBuyerName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const periodStats = computePeriodFinancials(state, period);
  const totalSalesAmount = periodStats.salesInPeriod.reduce((s, x) => s + x.totalAmount, 0);
  const totalSalesWeight = periodStats.salesInPeriod.reduce((s, x) => s + x.weightKg, 0);

  const targetTotalForPeriod =
    period === 'mingguan'
      ? state.settings.revenueTargets.reduce((s, r) => s + r.weekly, 0)
      : period === 'tahunan'
        ? state.settings.revenueTargets.reduce((s, r) => s + r.yearly, 0)
        : state.settings.revenueTargets.reduce((s, r) => s + r.monthly, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'RECORD_SALE',
        payload: {
          date,
          species,
          weightKg: Number(weightKg),
          pricePerKg: Number(pricePerKg),
          buyerName,
          notes,
        },
      },
      'Transaksi penjualan dicatat dan otomatis masuk ke pemasukan Keuangan'
    );
    setSubmitting(false);
    if (ok) {
      setModalOpen(false);
      setBuyerName('');
      setNotes('');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'DELETE_RECORD',
        payload: { entityType: 'sale', recordId: deleteTargetId },
      },
      'Transaksi penjualan dan entri keuangan terkait dihapus'
    );
    setSubmitting(false);
    if (ok) setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Penjualan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Riwayat penjualan per periode serta pencapaian target mingguan (Rp1 jt), bulanan (Rp4 jt), dan tahunan (Rp48 jt).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'mingguan', label: 'Mingguan' },
                { id: 'bulanan', label: 'Bulanan' },
                { id: 'tahunan', label: 'Tahunan' },
                { id: 'semua', label: 'Semua' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  period === p.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {role === 'admin' && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Catat Penjualan
            </button>
          )}
        </div>
      </div>

      {/* Period KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Total Penjualan ({period})</p>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-slate-900">
            {formatRupiah(totalSalesAmount)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {periodStats.salesInPeriod.length} transaksi tercatat
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Total Volume Terjual</p>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-sky-700">
            {formatKg(totalSalesWeight)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Akumulasi kilogram terjual</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Target Pendapatan ({period === 'semua' ? 'Bulanan' : period})</p>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-slate-900">
            {formatRupiah(targetTotalForPeriod)}
          </p>
          <p className="mt-1 text-xs text-sky-700 font-mono-num font-medium">
            Tercapai{' '}
            {targetTotalForPeriod > 0
              ? Math.round((totalSalesAmount / targetTotalForPeriod) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Target Breakdown by Species */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Target vs Realisasi Penjualan per Jenis Ikan
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Jenis Ikan</th>
                <th className="px-5 py-3 font-medium text-right">Realisasi Periode</th>
                <th className="px-5 py-3 font-medium text-right">Target Mingguan</th>
                <th className="px-5 py-3 font-medium text-right">Target Bulanan</th>
                <th className="px-5 py-3 font-medium text-right">Target Tahunan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FISH_SPECIES_LIST.map((sp) => {
                const target = state.settings.revenueTargets.find((r) => r.species === sp);
                return (
                  <tr key={sp}>
                    <td className="px-5 py-3 font-semibold text-slate-900">{sp}</td>
                    <td className="px-5 py-3 text-right font-mono-num font-bold text-sky-700">
                      {formatRupiah(periodStats.revenueBySpecies[sp])}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-600">
                      {formatRupiah(target?.weekly ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-600">
                      {formatRupiah(target?.monthly ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-600">
                      {formatRupiah(target?.yearly ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Daftar Transaksi Penjualan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Jenis Ikan</th>
                <th className="px-5 py-3 font-medium text-right">Berat</th>
                <th className="px-5 py-3 font-medium text-right">Harga / kg</th>
                <th className="px-5 py-3 font-medium text-right">Total Penjualan</th>
                <th className="px-5 py-3 font-medium">Pembeli & Sumber</th>
                {role === 'admin' && <th className="px-5 py-3 font-medium text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periodStats.salesInPeriod.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Belum ada transaksi penjualan pada periode ini.
                  </td>
                </tr>
              ) : (
                periodStats.salesInPeriod.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono-num text-slate-600">{sale.id}</td>
                    <td className="px-5 py-3 font-mono-num text-slate-600">
                      {formatDateID(sale.date)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">{sale.species}</td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-900">
                      {formatKg(sale.weightKg)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-600">
                      {formatRupiah(sale.pricePerKg)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num font-bold text-emerald-700">
                      {formatRupiah(sale.totalAmount)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <span className="font-medium text-slate-900">{sale.buyerName}</span>
                      {' · '}
                      <span>
                        {sale.sourceType === 'harvest'
                          ? `Otomatis Panen (${sale.sourceHarvestId})`
                          : 'Penjualan Langsung'}
                      </span>
                    </td>
                    {role === 'admin' && (
                      <td className="px-5 py-3 text-right">
                        {sale.sourceType === 'direct' ? (
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(sale.id)}
                            aria-label="Hapus transaksi penjualan"
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Terhubung Panen</span>
                        )}
                      </td>
                    )}
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
        title="Catat Transaksi Penjualan Langsung"
        subtitle="Otomatis masuk ke pemasukan Keuangan tanpa pencatatan ganda."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Jenis Ikan</label>
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
                Jumlah (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Harga per kg (Rp)
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
            <span className="text-slate-600">Total Penjualan</span>
            <span className="text-base font-bold font-mono-num text-emerald-700">
              {formatRupiah(Math.round(Number(weightKg || 0) * Number(pricePerKg || 0)))}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Pembeli / Pelanggan
            </label>
            <input
              type="text"
              required
              placeholder="Misal: Rumah Makan Mina Jaya"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Keterangan Transaksi
            </label>
            <input
              type="text"
              placeholder="Opsional"
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
              {submitting ? 'Menyimpan...' : 'Simpan Penjualan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Transaksi Penjualan"
        message="Menghapus transaksi penjualan ini juga akan menghapus entri pemasukan keuangan terkait agar laporan tetap akurat."
        confirmLabel="Hapus Transaksi"
        destructive
        busy={submitting}
      />
    </div>
  );
}
