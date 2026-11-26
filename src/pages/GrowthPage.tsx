import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmModal, Modal } from '../components/Modal';
import { useIkanara } from '../context/IkanaraContext';
import { formatDateID, formatNumber } from '../domain/calculations';
import type { SizeCategory } from '../domain/types';

export function GrowthPage() {
  const { role, state, mutate } = useIkanara();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [pondId, setPondId] = useState(state.ponds[0]?.id ?? 'KLM-01');
  const [measurementDate, setMeasurementDate] = useState(new Date().toISOString().slice(0, 10));
  const [averageWeightGrams, setAverageWeightGrams] = useState('120');
  const [averageLengthCm, setAverageLengthCm] = useState('24');
  const [sampleCount, setSampleCount] = useState('15');
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>('Siap panen');
  const [kecil, setKecil] = useState('24');
  const [sedang, setSedang] = useState('170');
  const [siapPanen, setSiapPanen] = useState('100');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedPond = state.ponds.find((p) => p.id === pondId);

  const openModalForPond = (targetPondId: string) => {
    const pond = state.ponds.find((p) => p.id === targetPondId);
    setPondId(targetPondId);
    if (pond) {
      setKecil(String(pond.sizeDistribution.kecil));
      setSedang(String(pond.sizeDistribution.sedang));
      setSiapPanen(String(pond.sizeDistribution.siapPanen));
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'LOG_GROWTH',
        payload: {
          pondId,
          measurementDate,
          averageWeightGrams: Number(averageWeightGrams),
          averageLengthCm: Number(averageLengthCm),
          sampleCount: Number(sampleCount),
          sizeCategory,
          sizeBreakdown: {
            kecil: Number(kecil),
            sedang: Number(sedang),
            siapPanen: Number(siapPanen),
          },
          notes,
        },
      },
      'Pengukuran pertumbuhan berhasil dicatat'
    );
    setSubmitting(false);
    if (ok) {
      setModalOpen(false);
      setNotes('');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'DELETE_RECORD',
        payload: { entityType: 'growth', recordId: deleteTargetId },
      },
      'Catatan pertumbuhan dihapus'
    );
    setSubmitting(false);
    if (ok) setDeleteTargetId(null);
  };

  const distributionSum = Number(kecil || 0) + Number(sedang || 0) + Number(siapPanen || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Pertumbuhan Ikan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pengukuran berat & panjang setiap dua minggu untuk memetakan populasi ukuran kecil, sedang, dan siap panen.
          </p>
        </div>

        {role === 'admin' && (
          <button
            type="button"
            onClick={() => openModalForPond(state.ponds[0]?.id ?? 'KLM-01')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Catat Pengukuran 2-Mingguan
          </button>
        )}
      </div>

      {/* Pond Size Distribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.ponds.map((pond) => (
          <div
            key={pond.id}
            className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono-num">{pond.id}</span>
                <span>{pond.species}</span>
              </div>
              <h2 className="mt-1 text-sm font-bold text-slate-900">{pond.name}</h2>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ukuran Kecil</span>
                  <span className="font-mono-num font-medium text-slate-900">
                    {formatNumber(pond.sizeDistribution.kecil)} ekor
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ukuran Sedang</span>
                  <span className="font-mono-num font-medium text-slate-900">
                    {formatNumber(pond.sizeDistribution.sedang)} ekor
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-emerald-700">Siap Panen</span>
                  <span className="font-mono-num font-bold text-emerald-700">
                    {formatNumber(pond.sizeDistribution.siapPanen)} ekor
                  </span>
                </div>
              </div>
            </div>

            {role === 'admin' && (
              <button
                type="button"
                onClick={() => openModalForPond(pond.id)}
                className="mt-4 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Perbarui Sampling
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Growth History */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Riwayat Pengukuran Pertumbuhan
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Kolam / Ikan</th>
                <th className="px-5 py-3 font-medium text-right">Berat Rata-rata</th>
                <th className="px-5 py-3 font-medium text-right">Panjang Rata-rata</th>
                <th className="px-5 py-3 font-medium text-right">Sampel</th>
                <th className="px-5 py-3 font-medium">Kategori</th>
                <th className="px-5 py-3 font-medium">Catatan</th>
                {role === 'admin' && <th className="px-5 py-3 font-medium text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.growthRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-mono-num text-slate-600">
                    {formatDateID(rec.measurementDate)}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {rec.pondId} · {rec.species}
                  </td>
                  <td className="px-5 py-3 text-right font-mono-num font-semibold text-slate-900">
                    {rec.averageWeightGrams} g
                  </td>
                  <td className="px-5 py-3 text-right font-mono-num text-slate-900">
                    {rec.averageLengthCm} cm
                  </td>
                  <td className="px-5 py-3 text-right font-mono-num text-slate-600">
                    {rec.sampleCount} ekor
                  </td>
                  <td className="px-5 py-3 font-semibold text-sky-700">{rec.sizeCategory}</td>
                  <td className="px-5 py-3 text-slate-600">{rec.notes}</td>
                  {role === 'admin' && (
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(rec.id)}
                        aria-label="Hapus catatan pertumbuhan"
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Catat Pengukuran Pertumbuhan Ikan"
        subtitle={
          selectedPond
            ? `Populasi aktif ${selectedPond.name}: ${selectedPond.currentPopulation} ekor`
            : undefined
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kolam</label>
              <select
                value={pondId}
                onChange={(e) => openModalForPond(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species} · {p.currentPopulation} ekor)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Pengukuran
              </label>
              <input
                type="date"
                required
                value={measurementDate}
                onChange={(e) => setMeasurementDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Berat Rata-rata (g)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={averageWeightGrams}
                onChange={(e) => setAverageWeightGrams(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Panjang Rata-rata (cm)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={averageLengthCm}
                onChange={(e) => setAverageLengthCm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sampel (ekor)
              </label>
              <input
                type="number"
                min="1"
                required
                value={sampleCount}
                onChange={(e) => setSampleCount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Kategori Dominan Ukuran
            </label>
            <select
              value={sizeCategory}
              onChange={(e) => setSizeCategory(e.target.value as SizeCategory)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="Kecil">Kecil</option>
              <option value="Sedang">Sedang</option>
              <option value="Siap panen">Siap panen</option>
            </select>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                Estimasi Distribusi Populasi Kolam (harus = {selectedPond?.currentPopulation ?? 0} ekor)
              </span>
              <span
                className={`font-mono-num font-semibold ${
                  distributionSum === (selectedPond?.currentPopulation ?? 0)
                    ? 'text-emerald-700'
                    : 'text-red-700'
                }`}
              >
                Total: {distributionSum}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Kecil</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={kecil}
                  onChange={(e) => setKecil(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Sedang</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={sedang}
                  onChange={(e) => setSedang(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Siap Panen</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={siapPanen}
                  onChange={(e) => setSiapPanen(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono-num"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Catatan</label>
            <input
              type="text"
              placeholder="Misal: Pertumbuhan merata, siap panen parsial"
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
              {submitting ? 'Menyimpan...' : 'Simpan Pengukuran'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Catatan Pertumbuhan"
        message="Apakah Anda yakin ingin menghapus catatan pengukuran ini?"
        confirmLabel="Hapus Catatan"
        destructive
        busy={submitting}
      />
    </div>
  );
}
