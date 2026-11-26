import React, { useState } from 'react';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useIkanara } from '../context/IkanaraContext';
import {
  FISH_SPECIES_LIST,
  formatDateID,
  formatKg,
  formatRupiah,
} from '../domain/calculations';
import type { FishSpecies } from '../domain/types';

export function FeedPage() {
  const { role, state, mutate } = useIkanara();

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(false);
  const [filterType, setFilterType] = useState<'semua' | 'masuk' | 'keluar'>('semua');

  // Purchase form
  const [selectedFeedId, setSelectedFeedId] = useState(state.feedInventory[0]?.id ?? '');
  const [feedName, setFeedName] = useState(state.feedInventory[0]?.name ?? '');
  const [feedType, setFeedType] = useState(state.feedInventory[0]?.feedType ?? 'Pelet Apung');
  const [targetSpecies, setTargetSpecies] = useState<FishSpecies | 'Semua'>(
    state.feedInventory[0]?.targetSpecies ?? 'Lele'
  );
  const [purchaseKg, setPurchaseKg] = useState('25');
  const [totalCost, setTotalCost] = useState('350000');
  const [minThresholdKg, setMinThresholdKg] = useState('20');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [recordExpense, setRecordExpense] = useState(true);

  // Use feed form
  const [useFeedId, setUseFeedId] = useState(state.feedInventory[0]?.id ?? '');
  const [usePondId, setUsePondId] = useState(state.ponds[0]?.id ?? '');
  const [useKg, setUseKg] = useState('1.5');
  const [useDate, setUseDate] = useState(new Date().toISOString().slice(0, 10));
  const [useNotes, setUseNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const totalStockKg = state.feedInventory.reduce((s, f) => s + f.stockKg, 0);
  const lowStockCount = state.feedInventory.filter((f) => f.stockKg <= f.minThresholdKg).length;

  const filteredTx = state.feedTransactions.filter((tx) =>
    filterType === 'semua' ? true : tx.type === filterType
  );

  const handleSelectExistingFeed = (id: string) => {
    setSelectedFeedId(id);
    if (id === '__new__') {
      setFeedName('');
      setFeedType('Pelet Apung');
      setTargetSpecies('Lele');
      setMinThresholdKg('20');
      return;
    }
    const found = state.feedInventory.find((f) => f.id === id);
    if (found) {
      setFeedName(found.name);
      setFeedType(found.feedType);
      setTargetSpecies(found.targetSpecies);
      setMinThresholdKg(String(found.minThresholdKg));
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'PURCHASE_FEED',
        payload: {
          feedId: selectedFeedId === '__new__' ? undefined : selectedFeedId,
          name: feedName,
          feedType,
          targetSpecies,
          amountKg: Number(purchaseKg),
          totalCost: Number(totalCost),
          minThresholdKg: Number(minThresholdKg),
          date: purchaseDate,
          notes: purchaseNotes,
          recordExpense,
        },
      },
      'Pembelian stok pakan berhasil dicatat'
    );
    setSubmitting(false);
    if (ok) {
      setPurchaseOpen(false);
      setPurchaseNotes('');
    }
  };

  const handleUseFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'USE_FEED',
        payload: {
          feedId: useFeedId,
          pondId: usePondId,
          amountKg: Number(useKg),
          date: useDate,
          notes: useNotes,
        },
      },
      'Penggunaan pakan berhasil dicatat dan stok diperbarui'
    );
    setSubmitting(false);
    if (ok) {
      setUseOpen(false);
      setUseNotes('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Persediaan Pakan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kontrol stok pakan masuk & keluar per kolam secara otomatis beserta peringatan stok hampir habis.
          </p>
        </div>

        {role === 'admin' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setUseOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <ArrowUpCircle className="h-4 w-4 text-sky-700" />
              Catat Pemberian Pakan
            </button>
            <button
              type="button"
              onClick={() => setPurchaseOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Catat Pembelian Pakan
            </button>
          </div>
        )}
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Total Sisa Stok Pakan</p>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-slate-900">
            {formatKg(totalStockKg)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {state.feedInventory.length} jenis pakan terdaftar
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Status Peringatan Stok</p>
          <p
            className={`mt-1.5 text-2xl font-bold font-mono-num ${
              lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {lowStockCount > 0 ? `${lowStockCount} Perlu Restock` : 'Semua Aman'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Berdasarkan batas minimum masing-masing pakan
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Total Transaksi Penggunaan</p>
          <p className="mt-1.5 text-2xl font-bold font-mono-num text-sky-700">
            {formatKg(
              state.feedTransactions
                .filter((t) => t.type === 'keluar')
                .reduce((s, t) => s + t.amountKg, 0)
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">Akumulasi pakan diberikan ke kolam</p>
        </div>
      </div>

      {/* Feed Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.feedInventory.map((item) => {
          const isLow = item.stockKg <= item.minThresholdKg;
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 bg-white flex flex-col justify-between ${
                isLow ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-num text-slate-500">{item.id}</span>
                  {isLow ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Stok Menipis
                    </span>
                  ) : (
                    <span className="font-medium text-emerald-700">Tersedia</span>
                  )}
                </div>
                <h2 className="mt-1.5 text-sm font-bold text-slate-900">{item.name}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.feedType} · Target: {item.targetSpecies}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Sisa Stok</span>
                  <span
                    className={`text-lg font-bold font-mono-num ${
                      isLow ? 'text-amber-800' : 'text-slate-900'
                    }`}
                  >
                    {formatKg(item.stockKg)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono-num">
                  <div>Min: {formatKg(item.minThresholdKg)}</div>
                  <div>{formatRupiah(item.unitPricePerKg)}/kg</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feed Transactions Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Riwayat Stok Masuk & Penggunaan Pakan
          </h2>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'semua', label: 'Semua' },
                { id: 'masuk', label: 'Pakan Masuk' },
                { id: 'keluar', label: 'Penggunaan Kolam' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterType === f.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Jenis</th>
                <th className="px-5 py-3 font-medium">Nama Pakan</th>
                <th className="px-5 py-3 font-medium">Kolam / Ikan</th>
                <th className="px-5 py-3 font-medium text-right">Jumlah</th>
                <th className="px-5 py-3 font-medium text-right">Nilai</th>
                <th className="px-5 py-3 font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-mono-num text-slate-600">
                    {formatDateID(tx.date)}
                  </td>
                  <td className="px-5 py-3">
                    {tx.type === 'masuk' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <ArrowDownCircle className="h-3.5 w-3.5" />
                        Masuk
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-sky-700">
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                        Pakai
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">{tx.feedName}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {tx.pondId ? `${tx.pondId} (${tx.species})` : tx.species || 'Gudang Utama'}
                  </td>
                  <td className="px-5 py-3 text-right font-mono-num font-semibold text-slate-900">
                    {tx.type === 'masuk' ? '+' : '-'}
                    {formatKg(tx.amountKg)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono-num text-slate-700">
                    {formatRupiah(tx.cost)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{tx.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Feed Modal */}
      <Modal
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        title="Catat Pembelian Pakan Masuk"
        subtitle="Menambah stok persediaan pakan otomatis dan mencatat pengeluaran jika dipilih."
      >
        <form onSubmit={handlePurchase} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pilih Pakan Terdaftar atau Buat Baru
            </label>
            <select
              value={selectedFeedId}
              onChange={(e) => handleSelectExistingFeed(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {state.feedInventory.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (Sisa {formatKg(f.stockKg)})
                </option>
              ))}
              <option value="__new__">+ Tambah Jenis Pakan Baru</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Pakan
              </label>
              <input
                type="text"
                required
                value={feedName}
                onChange={(e) => setFeedName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Ikan
              </label>
              <select
                value={targetSpecies}
                onChange={(e) => setTargetSpecies(e.target.value as FishSpecies | 'Semua')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {FISH_SPECIES_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="Semua">Semua Jenis</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jumlah (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={purchaseKg}
                onChange={(e) => setPurchaseKg(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Total Biaya (Rp)
              </label>
              <input
                type="number"
                min="0"
                required
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Batas Min (kg)
              </label>
              <input
                type="number"
                min="1"
                required
                value={minThresholdKg}
                onChange={(e) => setMinThresholdKg(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jenis / Spesifikasi Pakan
              </label>
              <input
                type="text"
                required
                value={feedType}
                onChange={(e) => setFeedType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan
            </label>
            <input
              type="text"
              placeholder="Misal: Pembelian 1 sak pakan apung"
              value={purchaseNotes}
              onChange={(e) => setPurchaseNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={recordExpense}
              onChange={(e) => setRecordExpense(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Catat otomatis sebagai pengeluaran pembelian pakan di Keuangan</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPurchaseOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pembelian'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Use Feed Modal */}
      <Modal
        open={useOpen}
        onClose={() => setUseOpen(false)}
        title="Catat Penggunaan Pakan Kolam"
        subtitle="Stok pakan akan berkurang otomatis dan memberi peringatan jika menipis."
      >
        <form onSubmit={handleUseFeed} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pilih Pakan
            </label>
            <select
              value={useFeedId}
              onChange={(e) => setUseFeedId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {state.feedInventory.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (Tersisa {formatKg(f.stockKg)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kolam Tujuan
              </label>
              <select
                value={usePondId}
                onChange={(e) => setUsePondId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jumlah Digunakan (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={useKg}
                onChange={(e) => setUseKg(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tanggal Pemberian
            </label>
            <input
              type="date"
              required
              value={useDate}
              onChange={(e) => setUseDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan Tambahan
            </label>
            <input
              type="text"
              placeholder="Misal: Pemberian pakan tambahan sore hari"
              value={useNotes}
              onChange={(e) => setUseNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setUseOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Catat Penggunaan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
