import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmModal, Modal } from '../components/Modal';
import { useIkanara } from '../context/IkanaraContext';
import { formatDateID, formatRupiah } from '../domain/calculations';
import type { MaintenanceFrequency } from '../domain/types';

const MAINTENANCE_GUIDES: Array<{ freq: MaintenanceFrequency; activity: string }> = [
  { freq: 'Harian', activity: 'Mengangkat sampah dan sisa pakan' },
  { freq: 'Mingguan', activity: 'Memeriksa air dan membersihkan kotoran ikan' },
  { freq: 'Dua mingguan', activity: 'Mengganti sebagian air jika diperlukan' },
  { freq: '2-3 bulanan', activity: 'Membersihkan kolam secara menyeluruh jika diperlukan' },
];

export function MaintenancePage() {
  const { role, state, mutate } = useIkanara();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [pondId, setPondId] = useState(state.ponds[0]?.id ?? 'KLM-01');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState<MaintenanceFrequency>('Harian');
  const [activity, setActivity] = useState(MAINTENANCE_GUIDES[0].activity);
  const [conditionBefore, setConditionBefore] = useState('Terdapat sisa pakan ringan di tepi kolam');
  const [conditionAfter, setConditionAfter] = useState('Permukaan air bersih dan sirkulasi lancar');
  const [officer, setOfficer] = useState('Petugas Lapangan 1');
  const [cost, setCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFrequencyChange = (nextFreq: MaintenanceFrequency) => {
    setFrequency(nextFreq);
    const guide = MAINTENANCE_GUIDES.find((g) => g.freq === nextFreq);
    if (guide) setActivity(guide.activity);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'LOG_MAINTENANCE',
        payload: {
          pondId,
          date,
          frequency,
          activity,
          conditionBefore,
          conditionAfter,
          officer,
          notes,
          cost: Number(cost || 0),
        },
      },
      'Catatan perawatan kolam berhasil disimpan'
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
        payload: { entityType: 'maintenance', recordId: deleteTargetId },
      },
      'Catatan perawatan dihapus'
    );
    setSubmitting(false);
    if (ok) setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Perawatan Kolam
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Jadwal pemeliharaan berkala dari harian hingga pembersihan menyeluruh beserta dokumentasi kondisi sebelum dan sesudah.
          </p>
        </div>

        {role === 'admin' && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Catat Perawatan Kolam
          </button>
        )}
      </div>

      {/* Standard Maintenance Schedule Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MAINTENANCE_GUIDES.map((guide) => (
          <div
            key={guide.freq}
            className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-sky-700">{guide.freq}</p>
              <p className="mt-1 text-sm font-medium text-slate-900 leading-snug">
                {guide.activity}
              </p>
            </div>
            <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono-num">
              Tercatat: {state.maintenanceRecords.filter((m) => m.frequency === guide.freq).length} kali
            </p>
          </div>
        ))}
      </div>

      {/* Maintenance History */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Riwayat Perawatan Kolam</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Kolam</th>
                <th className="px-5 py-3 font-medium">Frekuensi</th>
                <th className="px-5 py-3 font-medium">Jenis Kegiatan</th>
                <th className="px-5 py-3 font-medium">Sebelum → Sesudah</th>
                <th className="px-5 py-3 font-medium">Petugas</th>
                <th className="px-5 py-3 font-medium text-right">Biaya</th>
                {role === 'admin' && <th className="px-5 py-3 font-medium text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.maintenanceRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-mono-num text-slate-600 whitespace-nowrap">
                    {formatDateID(rec.date)}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                    {rec.pondId}
                  </td>
                  <td className="px-5 py-3 text-sky-700 font-medium whitespace-nowrap">
                    {rec.frequency}
                  </td>
                  <td className="px-5 py-3 text-slate-900">{rec.activity}</td>
                  <td className="px-5 py-3 text-slate-600 max-w-xs">
                    {rec.conditionBefore} → <span className="text-slate-900">{rec.conditionAfter}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap">{rec.officer}</td>
                  <td className="px-5 py-3 text-right font-mono-num text-slate-900">
                    {rec.cost > 0 ? formatRupiah(rec.cost) : '-'}
                  </td>
                  {role === 'admin' && (
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(rec.id)}
                        aria-label="Hapus catatan perawatan"
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
        title="Catat Kegiatan Perawatan Kolam"
        subtitle="Jika biaya perawatan > Rp0, otomatis dicatat ke pengeluaran Keuangan."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kolam</label>
              <select
                value={pondId}
                onChange={(e) => setPondId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Frekuensi</label>
              <select
                value={frequency}
                onChange={(e) => handleFrequencyChange(e.target.value as MaintenanceFrequency)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {MAINTENANCE_GUIDES.map((g) => (
                  <option key={g.freq} value={g.freq}>
                    {g.freq}
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
              Jenis Kegiatan Perawatan
            </label>
            <input
              type="text"
              required
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kondisi Sebelum Perawatan
              </label>
              <input
                type="text"
                required
                value={conditionBefore}
                onChange={(e) => setConditionBefore(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kondisi Setelah Perawatan
              </label>
              <input
                type="text"
                required
                value={conditionAfter}
                onChange={(e) => setConditionAfter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Petugas</label>
              <input
                type="text"
                required
                value={officer}
                onChange={(e) => setOfficer(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Biaya Perawatan (Rp)
              </label>
              <input
                type="number"
                min="0"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan Tambahan
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
              {submitting ? 'Menyimpan...' : 'Simpan Perawatan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Catatan Perawatan"
        message="Apakah Anda yakin ingin menghapus catatan perawatan kolam ini?"
        confirmLabel="Hapus Catatan"
        destructive
        busy={submitting}
      />
    </div>
  );
}
