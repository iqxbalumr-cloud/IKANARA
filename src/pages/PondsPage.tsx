import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Droplets,
  Plus,
  Waves,
} from 'lucide-react';
import { MediaImage } from '../components/MediaImage';
import { Modal } from '../components/Modal';
import { useIkanara } from '../context/IkanaraContext';
import {
  FISH_SPECIES_LIST,
  formatDateID,
  formatKg,
  formatNumber,
} from '../domain/calculations';
import type { FishSpecies, PondCondition, WaterQualityStatus } from '../domain/types';
import { FISH_IMAGES } from '../utils/media';

type PondHistoryTab = 'pakan' | 'kesehatan' | 'pertumbuhan' | 'perawatan' | 'kematian';

export function PondsPage() {
  const { role, state, selectedPondId, navigateTo, mutate } = useIkanara();

  const [createOpen, setCreateOpen] = useState(false);
  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<PondHistoryTab>('pakan');

  // Create Pond Form
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<FishSpecies>('Lele');
  const [lengthMeters, setLengthMeters] = useState('3');
  const [widthMeters, setWidthMeters] = useState('4');
  const [stockingDate, setStockingDate] = useState(new Date().toISOString().slice(0, 10));
  const [estimatedHarvestDate, setEstimatedHarvestDate] = useState('2027-01-15');
  const [initialSeedCount, setInitialSeedCount] = useState('100');
  const [waterNote, setWaterNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedPond = useMemo(
    () => state.ponds.find((p) => p.id === selectedPondId) ?? null,
    [selectedPondId, state.ponds]
  );

  // Edit Pond Status Form
  const [editCondition, setEditCondition] = useState<PondCondition>('Optimal');
  const [editWaterStatus, setEditWaterStatus] = useState<WaterQualityStatus>('Jernih & Sehat');
  const [editWaterNote, setEditWaterNote] = useState('');
  const [editHarvestDate, setEditHarvestDate] = useState('');

  const openEditStatusModal = () => {
    if (!selectedPond) return;
    setEditCondition(selectedPond.condition);
    setEditWaterStatus(selectedPond.waterStatus);
    setEditWaterNote(selectedPond.waterNote);
    setEditHarvestDate(selectedPond.estimatedHarvestDate);
    setEditStatusOpen(true);
  };

  const handleCreatePond = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'CREATE_POND',
        payload: {
          name,
          species,
          lengthMeters: Number(lengthMeters),
          widthMeters: Number(widthMeters),
          stockingDate,
          initialSeedCount: Number(initialSeedCount),
          waterNote,
          estimatedHarvestDate,
        },
      },
      'Kolam baru berhasil ditambahkan'
    );
    setSubmitting(false);
    if (ok) {
      setCreateOpen(false);
      setName('');
      setWaterNote('');
    }
  };

  const handleUpdatePondStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPond) return;
    setSubmitting(true);
    const ok = await mutate(
      {
        type: 'UPDATE_POND_STATUS',
        payload: {
          pondId: selectedPond.id,
          condition: editCondition,
          waterStatus: editWaterStatus,
          waterNote: editWaterNote,
          estimatedHarvestDate: editHarvestDate,
        },
      },
      'Kondisi kolam & kualitas air diperbarui'
    );
    setSubmitting(false);
    if (ok) setEditStatusOpen(false);
  };

  // Dedicated Pond Detail Page
  if (selectedPond) {
    const pondFeedLogs = state.feedTransactions.filter((f) => f.pondId === selectedPond.id);
    const pondHealthLogs = state.healthRecords.filter((h) => h.pondId === selectedPond.id);
    const pondGrowthLogs = state.growthRecords.filter((g) => g.pondId === selectedPond.id);
    const pondMaintLogs = state.maintenanceRecords.filter((m) => m.pondId === selectedPond.id);
    const pondMortalityLogs = state.mortalityRecords.filter((m) => m.pondId === selectedPond.id);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo('kolam', null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Kolam
            </button>
          </div>
          {role === 'admin' && (
            <button
              type="button"
              onClick={openEditStatusModal}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
            >
              Perbarui Kondisi & Kualitas Air
            </button>
          )}
        </div>

        {/* Pond Summary Header */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-4 aspect-[4/3] lg:aspect-auto bg-slate-100">
            <MediaImage
              src={FISH_IMAGES[selectedPond.species]}
              alt={`${selectedPond.name} - ${selectedPond.species}`}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="lg:col-span-8 p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono-num font-semibold text-slate-800">
                      {selectedPond.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedPond.species}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {selectedPond.lengthMeters} × {selectedPond.widthMeters} m ({selectedPond.areaSqm} m²)
                    </span>
                  </div>
                  <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    {selectedPond.name}
                  </h1>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    selectedPond.condition === 'Optimal'
                      ? 'text-emerald-700'
                      : selectedPond.condition === 'Perlu Perhatian'
                        ? 'text-amber-700'
                        : 'text-sky-700'
                  }`}
                >
                  Kondisi: {selectedPond.condition}
                </span>
              </div>

              <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50/70 px-4 py-3 flex items-start gap-2.5 text-xs text-sky-900">
                <Droplets className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Status Air: {selectedPond.waterStatus}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>{selectedPond.waterNote}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-[11px] text-slate-500">Bibit Awal</p>
                <p className="mt-0.5 text-base font-bold font-mono-num text-slate-900">
                  {formatNumber(selectedPond.initialSeedCount)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Populasi Saat Ini</p>
                <p className="mt-0.5 text-base font-bold font-mono-num text-sky-700">
                  {formatNumber(selectedPond.currentPopulation)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Ikan Mati</p>
                <p className="mt-0.5 text-base font-bold font-mono-num text-red-700">
                  {formatNumber(selectedPond.mortalityCount)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Ikan Dipanen</p>
                <p className="mt-0.5 text-base font-bold font-mono-num text-emerald-700">
                  {formatNumber(selectedPond.harvestedCount)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Est. Panen</p>
                <p className="mt-0.5 text-xs font-semibold font-mono-num text-slate-900">
                  {formatDateID(selectedPond.estimatedHarvestDate)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span>Tanggal Penebaran: <strong className="font-mono-num text-slate-900">{formatDateID(selectedPond.stockingDate)}</strong></span>
              <span className="font-mono-num">
                Ukuran: Kecil {selectedPond.sizeDistribution.kecil} · Sedang {selectedPond.sizeDistribution.sedang} · Siap Panen {selectedPond.sizeDistribution.siapPanen}
              </span>
            </div>
          </div>
        </div>

        {/* Pond History Tabs */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {(
                [
                  { id: 'pakan', label: `Riwayat Pakan (${pondFeedLogs.length})` },
                  { id: 'kesehatan', label: `Kesehatan (${pondHealthLogs.length})` },
                  { id: 'pertumbuhan', label: `Pertumbuhan (${pondGrowthLogs.length})` },
                  { id: 'perawatan', label: `Perawatan (${pondMaintLogs.length})` },
                  { id: 'kematian', label: `Kematian (${pondMortalityLogs.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHistoryTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    historyTab === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-x-auto">
            {historyTab === 'pakan' && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 font-medium">Tanggal</th>
                    <th className="py-2 font-medium">Nama Pakan</th>
                    <th className="py-2 font-medium text-right">Jumlah</th>
                    <th className="py-2 font-medium pl-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pondFeedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        Belum ada riwayat pemberian pakan untuk kolam ini.
                      </td>
                    </tr>
                  ) : (
                    pondFeedLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 font-mono-num text-slate-700">{formatDateID(log.date)}</td>
                        <td className="py-2.5 font-medium text-slate-900">{log.feedName}</td>
                        <td className="py-2.5 text-right font-mono-num font-semibold text-slate-900">
                          {formatKg(log.amountKg)}
                        </td>
                        <td className="py-2.5 pl-4 text-slate-600">{log.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {historyTab === 'kesehatan' && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 font-medium">Tanggal</th>
                    <th className="py-2 font-medium">Jadwal</th>
                    <th className="py-2 font-medium">Gejala & Nafsu Makan</th>
                    <th className="py-2 font-medium">Tindakan</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pondHealthLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        Belum ada pemeriksaan kesehatan untuk kolam ini.
                      </td>
                    </tr>
                  ) : (
                    pondHealthLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 font-mono-num text-slate-700">{formatDateID(log.checkDate)}</td>
                        <td className="py-2.5 text-slate-700">{log.frequency}</td>
                        <td className="py-2.5 text-slate-900">
                          {log.appetiteAndMovement} ({log.symptoms})
                        </td>
                        <td className="py-2.5 text-slate-600">{log.actionTaken}</td>
                        <td className="py-2.5 font-semibold">
                          <span className={log.isSick && !log.resolved ? 'text-red-700' : 'text-emerald-700'}>
                            {log.isSick && !log.resolved ? 'Dalam Penanganan' : 'Sehat / Pulih'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {historyTab === 'pertumbuhan' && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 font-medium">Tanggal Ukur</th>
                    <th className="py-2 font-medium text-right">Berat Rata-rata</th>
                    <th className="py-2 font-medium text-right">Panjang Rata-rata</th>
                    <th className="py-2 font-medium pl-4">Kategori</th>
                    <th className="py-2 font-medium">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pondGrowthLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        Belum ada catatan pertumbuhan untuk kolam ini.
                      </td>
                    </tr>
                  ) : (
                    pondGrowthLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 font-mono-num text-slate-700">
                          {formatDateID(log.measurementDate)}
                        </td>
                        <td className="py-2.5 text-right font-mono-num font-semibold text-slate-900">
                          {log.averageWeightGrams} g
                        </td>
                        <td className="py-2.5 text-right font-mono-num text-slate-900">
                          {log.averageLengthCm} cm
                        </td>
                        <td className="py-2.5 pl-4 font-medium text-sky-700">{log.sizeCategory}</td>
                        <td className="py-2.5 text-slate-600">{log.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {historyTab === 'perawatan' && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 font-medium">Tanggal</th>
                    <th className="py-2 font-medium">Frekuensi</th>
                    <th className="py-2 font-medium">Kegiatan</th>
                    <th className="py-2 font-medium">Sebelum → Sesudah</th>
                    <th className="py-2 font-medium">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pondMaintLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        Belum ada catatan perawatan kolam ini.
                      </td>
                    </tr>
                  ) : (
                    pondMaintLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 font-mono-num text-slate-700">{formatDateID(log.date)}</td>
                        <td className="py-2.5 text-slate-700">{log.frequency}</td>
                        <td className="py-2.5 font-medium text-slate-900">{log.activity}</td>
                        <td className="py-2.5 text-slate-600">
                          {log.conditionBefore} → {log.conditionAfter}
                        </td>
                        <td className="py-2.5 text-slate-700">{log.officer}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {historyTab === 'kematian' && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 font-medium">Tanggal</th>
                    <th className="py-2 font-medium text-right">Jumlah Mati</th>
                    <th className="py-2 font-medium pl-4">Dugaan Penyebab</th>
                    <th className="py-2 font-medium">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pondMortalityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        Tidak ada catatan kematian ikan di kolam ini.
                      </td>
                    </tr>
                  ) : (
                    pondMortalityLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 font-mono-num text-slate-700">{formatDateID(log.date)}</td>
                        <td className="py-2.5 text-right font-mono-num font-semibold text-red-700">
                          {log.deadCount} ekor
                        </td>
                        <td className="py-2.5 pl-4 text-slate-900">{log.suspectedCause}</td>
                        <td className="py-2.5 text-slate-600">{log.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Update Pond Status Modal */}
        <Modal
          open={editStatusOpen}
          onClose={() => setEditStatusOpen(false)}
          title={`Perbarui Kondisi ${selectedPond.name}`}
          subtitle={`ID Kolam ${selectedPond.id} · ${selectedPond.species}`}
        >
          <form onSubmit={handleUpdatePondStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kondisi Kolam
              </label>
              <select
                value={editCondition}
                onChange={(e) => setEditCondition(e.target.value as PondCondition)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              >
                <option value="Optimal">Optimal</option>
                <option value="Perlu Perhatian">Perlu Perhatian</option>
                <option value="Pemulihan">Pemulihan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status Kualitas Air
              </label>
              <select
                value={editWaterStatus}
                onChange={(e) => setEditWaterStatus(e.target.value as WaterQualityStatus)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              >
                <option value="Jernih & Sehat">Jernih & Sehat</option>
                <option value="Perlu Sirkulasi">Perlu Sirkulasi</option>
                <option value="Keruh / Perlu Ganti Air">Keruh / Perlu Ganti Air</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Estimasi Tanggal Panen
              </label>
              <input
                type="date"
                value={editHarvestDate}
                onChange={(e) => setEditHarvestDate(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Catatan Kondisi Air & Kolam
              </label>
              <textarea
                rows={3}
                value={editWaterNote}
                onChange={(e) => setEditWaterNote(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditStatusOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Pond Directory View
  const totalArea = state.ponds.reduce((sum, p) => sum + p.areaSqm, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Data Kolam
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Total {state.ponds.length} kolam budidaya aktif dengan luas gabungan {totalArea} m². Klik kolam untuk melihat detail dan riwayat lengkap.
          </p>
        </div>

        {role === 'admin' && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Tambah Kolam Baru
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {state.ponds.map((pond) => (
          <article
            key={pond.id}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col sm:flex-row"
          >
            <div className="sm:w-44 h-44 sm:h-auto shrink-0 bg-slate-100">
              <MediaImage
                src={FISH_IMAGES[pond.species]}
                alt={`${pond.name} (${pond.species})`}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-mono-num font-semibold text-slate-700">{pond.id}</span>
                  <span
                    className={`font-semibold ${
                      pond.condition === 'Optimal'
                        ? 'text-emerald-700'
                        : pond.condition === 'Perlu Perhatian'
                          ? 'text-amber-700'
                          : 'text-sky-700'
                    }`}
                  >
                    {pond.condition}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{pond.name}</h2>
                <p className="text-xs text-slate-500">
                  {pond.species} · {pond.lengthMeters} × {pond.widthMeters} m ({pond.areaSqm} m²) · Tebar {formatDateID(pond.stockingDate)}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-sky-700">
                  <Waves className="h-3.5 w-3.5 shrink-0" />
                  <span>{pond.waterStatus}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Populasi</span>
                    <span className="font-mono-num font-bold text-slate-900">
                      {formatNumber(pond.currentPopulation)} ekor
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mati / Panen</span>
                    <span className="font-mono-num text-slate-700">
                      {pond.mortalityCount} / {pond.harvestedCount}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('kolam', pond.id)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  Detail Kolam
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Add New Pond Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah Kolam Budidaya Baru"
        subtitle="Sistem akan membuat ID kolam unik dan menghitung luas secara otomatis."
      >
        <form onSubmit={handleCreatePond} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Kolam
              </label>
              <input
                type="text"
                required
                placeholder="Misal: Kolam Lele A2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Panjang (m)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={lengthMeters}
                onChange={(e) => setLengthMeters(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lebar (m)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={widthMeters}
                onChange={(e) => setWidthMeters(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Bibit Awal (ekor)
              </label>
              <input
                type="number"
                min="0"
                required
                value={initialSeedCount}
                onChange={(e) => setInitialSeedCount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Estimasi Tanggal Panen
              </label>
              <input
                type="date"
                required
                value={estimatedHarvestDate}
                onChange={(e) => setEstimatedHarvestDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan Kondisi Air Awal
            </label>
            <input
              type="text"
              placeholder="Misal: Aerasi aktif, air baru diendapkan 3 hari"
              value={waterNote}
              onChange={(e) => setWaterNote(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Kolam'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
