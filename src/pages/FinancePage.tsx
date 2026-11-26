import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmModal, Modal } from '../components/Modal';
import { useIkanara } from '../context/IkanaraContext';
import {
  computeDashboardMetrics,
  computePeriodFinancials,
  formatDateID,
  formatRupiah,
} from '../domain/calculations';
import type { ExpenseCategory, IncomeCategory, ReportPeriod } from '../domain/types';

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Penjualan lele',
  'Penjualan nila',
  'Penjualan ikan emas',
  'Penjualan patin',
  'Pemasukan lainnya',
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Pembelian pakan',
  'Pembelian bibit',
  'Biaya operasional',
  'Perawatan kolam',
  'Perbaikan peralatan',
  'Pengeluaran lainnya',
];

export function FinancePage() {
  const { role, state, mutate } = useIkanara();

  const [period, setPeriod] = useState<ReportPeriod>('semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showCapitalModal, setShowCapitalModal] = useState(false);

  const [txType, setTxType] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');
  const [category, setCategory] = useState<IncomeCategory | ExpenseCategory>('Biaya operasional');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const m = computeDashboardMetrics(state);
  const periodFin = computePeriodFinancials(state, period);

  const handleTypeSwitch = (nextType: 'pemasukan' | 'pengeluaran') => {
    setTxType(nextType);
    setCategory(nextType === 'pemasukan' ? 'Pemasukan lainnya' : 'Biaya operasional');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'RECORD_FINANCE',
        payload: {
          date,
          type: txType,
          category,
          amount: Number(amount),
          description,
        },
      },
      'Transaksi keuangan berhasil dicatat'
    );
    setSubmitting(false);
    if (ok) {
      setModalOpen(false);
      setAmount('');
      setDescription('');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'DELETE_RECORD',
        payload: { entityType: 'finance', recordId: deleteTargetId },
      },
      'Transaksi keuangan dihapus'
    );
    setSubmitting(false);
    if (ok) setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Keuangan Usaha
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pemantauan modal awal, pemasukan, pengeluaran operasional, keuntungan bersih, dan saldo kas tanpa pencatatan ganda.
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
              Catat Transaksi Kas
            </button>
          )}
        </div>
      </div>

      {/* 5 Financial Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => setShowCapitalModal(true)}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300 transition-colors"
        >
          <p className="text-xs text-slate-500">Total Modal Awal</p>
          <p className="mt-1.5 text-lg font-bold font-mono-num text-slate-900">
            {formatRupiah(m.totalInitialCapital)}
          </p>
          <p className="mt-1 text-[11px] text-sky-700 font-medium">Lihat 9 rincian modal</p>
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Pemasukan ({period})</p>
          <p className="mt-1.5 text-lg font-bold font-mono-num text-emerald-700">
            {formatRupiah(periodFin.totalIncome)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Penjualan & pemasukan lain</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Pengeluaran ({period})</p>
          <p className="mt-1.5 text-lg font-bold font-mono-num text-red-700">
            {formatRupiah(periodFin.totalExpense)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Pakan, bibit, operasional</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Keuntungan Bersih ({period})</p>
          <p
            className={`mt-1.5 text-lg font-bold font-mono-num ${
              periodFin.netProfit >= 0 ? 'text-emerald-700' : 'text-slate-900'
            }`}
          >
            {formatRupiah(periodFin.netProfit)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Pemasukan − Pengeluaran</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-white">
          <p className="text-xs text-slate-300">Saldo Kas Saat Ini</p>
          <p className="mt-1.5 text-lg font-bold font-mono-num text-white">
            {formatRupiah(m.cashBalance)}
          </p>
          <p className="mt-1 text-[11px] text-sky-300">Likuiditas operasional tersedia</p>
        </div>
      </div>

      {/* Financial Ledger */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Buku Kas Pemasukan & Pengeluaran ({periodFin.filteredTx.length} entri)
          </h2>
          <span className="text-xs text-slate-500">
            Terintegrasi otomatis dengan Panen, Penjualan, Bibit & Pakan
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Tipe</th>
                <th className="px-5 py-3 font-medium">Kategori</th>
                <th className="px-5 py-3 font-medium">Keterangan</th>
                <th className="px-5 py-3 font-medium text-right">Nominal</th>
                {role === 'admin' && <th className="px-5 py-3 font-medium text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periodFin.filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Tidak ada transaksi keuangan pada periode ini.
                  </td>
                </tr>
              ) : (
                periodFin.filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono-num text-slate-600">{tx.id}</td>
                    <td className="px-5 py-3 font-mono-num text-slate-600 whitespace-nowrap">
                      {formatDateID(tx.date)}
                    </td>
                    <td className="px-5 py-3 font-semibold whitespace-nowrap">
                      <span
                        className={
                          tx.type === 'pemasukan' ? 'text-emerald-700' : 'text-red-700'
                        }
                      >
                        {tx.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {tx.category}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{tx.description}</td>
                    <td
                      className={`px-5 py-3 text-right font-mono-num font-bold whitespace-nowrap ${
                        tx.type === 'pemasukan' ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'pemasukan' ? '+' : '-'}
                      {formatRupiah(tx.amount)}
                    </td>
                    {role === 'admin' && (
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {tx.sourceType === 'harvest' || tx.sourceType === 'sale' ? (
                          <span className="text-[11px] text-slate-400">Sinkron Otomatis</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(tx.id)}
                            aria-label="Hapus transaksi keuangan"
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      {/* Add Manual Financial Transaction */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Catat Pemasukan / Pengeluaran Kas"
        subtitle="Untuk penjualan ikan, gunakan menu Panen atau Penjualan agar tidak terjadi pencatatan ganda."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleTypeSwitch('pengeluaran')}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                txType === 'pengeluaran'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('pemasukan')}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                txType === 'pemasukan'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Pemasukan Lainnya
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as IncomeCategory | ExpenseCategory)
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {(txType === 'pemasukan' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nominal (Rp)
            </label>
            <input
              type="number"
              min="100"
              required
              placeholder="Misal: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Keterangan Transaksi
            </label>
            <input
              type="text"
              required
              placeholder="Misal: Perbaikan selang aerator atau tagihan listrik pompa"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Initial Capital Breakdown Modal */}
      <Modal
        open={showCapitalModal}
        onClose={() => setShowCapitalModal(false)}
        title="Rincian Alokasi Modal Usaha Awal"
        subtitle={`Total Modal Usaha: ${formatRupiah(state.settings.totalInitialCapital)}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 font-medium">Kebutuhan</th>
                <th className="py-2 font-medium">Pos</th>
                <th className="py-2 font-medium text-right">Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.settings.capitalAllocations.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 font-medium text-slate-900">{item.name}</td>
                  <td className="py-2.5 text-slate-500">{item.category}</td>
                  <td className="py-2.5 text-right font-mono-num font-semibold text-slate-900">
                    {formatRupiah(item.amount)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 font-bold">
                <td colSpan={2} className="py-3 text-slate-900">
                  Total Modal Awal
                </td>
                <td className="py-3 text-right font-mono-num text-slate-900">
                  {formatRupiah(state.settings.totalInitialCapital)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Transaksi Keuangan"
        message="Apakah Anda yakin ingin menghapus transaksi keuangan ini? Perubahan saldo kas akan dihitung ulang secara otomatis."
        confirmLabel="Hapus Transaksi"
        destructive
        busy={submitting}
      />
    </div>
  );
}
