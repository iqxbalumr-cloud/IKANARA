import React, { useState } from 'react';
import { CheckCircle2, Plus, Skull, Trash2 } from 'lucide-react';
import { ConfirmModal, Modal } from '../components/Modal';
import { useIkanara } from '../context/IkanaraContext';
import { formatDateID, formatNumber } from '../domain/calculations';
import type { HealthCheckFrequency } from '../domain/types';

export function HealthPage() {
  const { role, state, mutate } = useIkanara();

  const [activeTab, setActiveTab] = useState<'kesehatan' | 'kematian'>('kesehatan');
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [mortalityModalOpen, setMortalityModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Health form
  const [pondId, setPondId] = useState(state.ponds[0]?.id ?? 'KLM-01');
  const [checkDate, setCheckDate] = useState(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState<HealthCheckFrequency>('Harian');
  const [appetiteAndMovement, setAppetiteAndMovement] = useState('Gerakan aktif dan nafsu makan baik');
  const [symptoms, setSymptoms] = useState('');
  const [suspectedCause, setSuspectedCause] = useState('');
  const [affectedCount, setAffectedCount] = useState('0');
  const [actionTaken, setActionTaken] = useState('Pemantauan rutin kualitas air dan nafsu makan');
  const [monitoringResult, setMonitoringResult] = useState('Kondisi stabil');
  const [isSick, setIsSick] = useState(false);

  // Mortality form
  const [mortPondId, setMortPondId] = useState(state.ponds[0]?.id ?? 'KLM-01');
  const [mortDate, setMortDate] = useState(new Date().toISOString().slice(0, 10));
  const [deadCount, setDeadCount] = useState('1');
  const [mortCause, setMortCause] = useState('');
  const [mortNotes, setMortNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const totalDeaths = state.mortalityRecords.reduce((s, r) => s + r.deadCount, 0);
  const activeSickCases = state.healthRecords.filter((h) => h.isSick && !h.resolved).length;

  const handleCreateHealth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'LOG_HEALTH_CHECK',
        payload: {
          pondId,
          checkDate,
          frequency,
          appetiteAndMovement,
          symptoms,
          suspectedCause,
          affectedCount: Number(affectedCount),
          actionTaken,
          monitoringResult,
          isSick,
        },
      },
      'Pemeriksaan kesehatan ikan berhasil dicatat'
    );
    setSubmitting(false);
    if (ok) {
      setHealthModalOpen(false);
      setSymptoms('');
      setSuspectedCause('');
      setIsSick(false);
    }
  };

  const handleCreateMortality = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'LOG_MORTALITY',
        payload: {
          pondId: mortPondId,
          date: mortDate,
          deadCount: Number(deadCount),
          suspectedCause: mortCause,
          notes: mortNotes,
        },
      },
      'Kematian ikan dicatat. Populasi kolam berkurang & notifikasi dikirim ke Owner.'
    );
    setSubmitting(false);
    if (ok) {
      setMortalityModalOpen(false);
      setMortCause('');
      setMortNotes('');
    }
  };

  const handleResolveHealth = async (recordId: string) => {
    await mutate(
      {
        type: 'RESOLVE_HEALTH_RECORD',
        payload: {
          recordId,
          monitoringResult: 'Ikan telah pulih dan nafsu makan kembali normal.',
        },
      },
      'Kasus kesehatan ditandai pulih'
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'DELETE_RECORD',
        payload: { entityType: 'health', recordId: deleteTargetId },
      },
      'Catatan pemeriksaan kesehatan dihapus'
    );
    setSubmitting(false);
    if (ok) setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kesehatan & Pencatatan Kematian Ikan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Jadwal pemeriksaan harian, mingguan, dua mingguan, penanganan ikan sakit, serta pencatatan mortalitas otomatis.
          </p>
        </div>

        {role === 'admin' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMortalityModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              <Skull className="h-4 w-4" />
              Catat Kematian Ikan
            </button>
            <button
              type="button"
              onClick={() => setHealthModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Catat Pemeriksaan Kesehatan
            </button>
          </div>
        )}
      </div>

      {/* Inspection Protocol Guide + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Pemeriksaan Harian</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">Gerakan & Nafsu Makan</p>
          <p className="mt-1 text-xs text-slate-500">Diamati setiap kali pemberian pakan.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Pemeriksaan Mingguan</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">Kondisi Fisik Tubuh</p>
          <p className="mt-1 text-xs text-slate-500">Cek sirip, kulit, sisik, dan lendir ikan.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Kasus Sakit Aktif</p>
          <p
            className={`mt-1 text-xl font-bold font-mono-num ${
              activeSickCases > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {activeSickCases} kasus
          </p>
          <p className="mt-1 text-xs text-slate-500">Perlu pemantauan & tindakan</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Kematian Tercatat</p>
          <p className="mt-1 text-xl font-bold font-mono-num text-slate-900">
            {formatNumber(totalDeaths)} ekor
          </p>
          <p className="mt-1 text-xs text-slate-500">Otomatis mengurangi populasi</p>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('kesehatan')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'kesehatan'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Riwayat Pemeriksaan Kesehatan ({state.healthRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kematian')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'kematian'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catatan Kematian Ikan ({state.mortalityRecords.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'kesehatan' ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Kolam / Ikan</th>
                  <th className="px-5 py-3 font-medium">Frekuensi</th>
                  <th className="px-5 py-3 font-medium">Gejala & Penyebab</th>
                  <th className="px-5 py-3 font-medium">Tindakan & Hasil</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {role === 'admin' && <th className="px-5 py-3 font-medium text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.healthRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono-num text-slate-600 whitespace-nowrap">
                      {formatDateID(rec.checkDate)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {rec.pondId} · {rec.species}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{rec.frequency}</td>
                    <td className="px-5 py-3 text-slate-700 max-w-xs">
                      <p className="font-medium text-slate-900">{rec.appetiteAndMovement}</p>
                      <p className="text-slate-500 mt-0.5">
                        Gejala: {rec.symptoms} · Terdampak: {rec.affectedCount} ekor ({rec.suspectedCause})
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-700 max-w-xs">
                      <p>{rec.actionTaken}</p>
                      <p className="text-slate-500 mt-0.5">Hasil: {rec.monitoringResult}</p>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {rec.isSick && !rec.resolved ? (
                        <span className="font-semibold text-red-700">Sakit · Ditangani</span>
                      ) : (
                        <span className="font-semibold text-emerald-700">Sehat / Pulih</span>
                      )}
                    </td>
                    {role === 'admin' && (
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {rec.isSick && !rec.resolved && (
                            <button
                              type="button"
                              onClick={() => handleResolveHealth(rec.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Tandai Pulih
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(rec.id)}
                            aria-label="Hapus catatan kesehatan"
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Kolam</th>
                  <th className="px-5 py-3 font-medium">Jenis Ikan</th>
                  <th className="px-5 py-3 font-medium text-right">Jumlah Mati</th>
                  <th className="px-5 py-3 font-medium">Dugaan Penyebab</th>
                  <th className="px-5 py-3 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.mortalityRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono-num text-slate-600">{rec.id}</td>
                    <td className="px-5 py-3 font-mono-num text-slate-600">
                      {formatDateID(rec.date)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">{rec.pondId}</td>
                    <td className="px-5 py-3 text-slate-700">{rec.species}</td>
                    <td className="px-5 py-3 text-right font-mono-num font-bold text-red-700">
                      {rec.deadCount} ekor
                    </td>
                    <td className="px-5 py-3 text-slate-900">{rec.suspectedCause}</td>
                    <td className="px-5 py-3 text-slate-600">{rec.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Health Check Modal */}
      <Modal
        open={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        title="Catat Pemeriksaan Kesehatan Ikan"
        subtitle="Jika ikan terdeteksi sakit, peringatan otomatis akan dikirim ke dashboard."
      >
        <form onSubmit={handleCreateHealth} className="space-y-4">
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
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Jadwal</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as HealthCheckFrequency)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="Harian">Harian</option>
                <option value="Mingguan">Mingguan</option>
                <option value="Dua mingguan">Dua mingguan</option>
                <option value="Penanganan Sakit">Penanganan Sakit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Kondisi Gerakan & Nafsu Makan
            </label>
            <input
              type="text"
              required
              value={appetiteAndMovement}
              onChange={(e) => setAppetiteAndMovement(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-800">
            <input
              type="checkbox"
              checked={isSick}
              onChange={(e) => setIsSick(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Ditemukan indikasi ikan sakit / gejala klinis</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Gejala yang Diamati
              </label>
              <input
                type="text"
                placeholder="Misal: Sirip kemerahan / berenang miring"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jumlah Terdampak
              </label>
              <input
                type="number"
                min="0"
                required
                value={affectedCount}
                onChange={(e) => setAffectedCount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Dugaan Penyebab
            </label>
            <input
              type="text"
              placeholder="Misal: Perubahan suhu atau sisa pakan menumpuk"
              value={suspectedCause}
              onChange={(e) => setSuspectedCause(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tindakan Penanganan
            </label>
            <input
              type="text"
              required
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Hasil Pemantauan
            </label>
            <input
              type="text"
              required
              value={monitoringResult}
              onChange={(e) => setMonitoringResult(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setHealthModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pemeriksaan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Mortality Modal */}
      <Modal
        open={mortalityModalOpen}
        onClose={() => setMortalityModalOpen(false)}
        title="Catat Kematian Ikan"
        subtitle="Populasi kolam akan berkurang otomatis dan Owner menerima notifikasi langsung."
      >
        <form onSubmit={handleCreateMortality} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kolam
              </label>
              <select
                value={mortPondId}
                onChange={(e) => setMortPondId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species} · Populasi {p.currentPopulation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Kematian
              </label>
              <input
                type="date"
                required
                value={mortDate}
                onChange={(e) => setMortDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Jumlah Ikan Mati (ekor)
            </label>
            <input
              type="number"
              min="1"
              required
              value={deadCount}
              onChange={(e) => setDeadCount(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Dugaan Penyebab
            </label>
            <input
              type="text"
              required
              placeholder="Misal: Jamur air / fluktuasi suhu malam"
              value={mortCause}
              onChange={(e) => setMortCause(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Keterangan Tambahan
            </label>
            <input
              type="text"
              placeholder="Tindakan lanjutan yang dilakukan"
              value={mortNotes}
              onChange={(e) => setMortNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMortalityModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Catat Kematian'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Catatan Kesehatan"
        message="Apakah Anda yakin ingin menghapus catatan pemeriksaan kesehatan ini? Tindakan ini tercatat pada log aktivitas."
        confirmLabel="Hapus Catatan"
        destructive
        busy={submitting}
      />
    </div>
  );
}
