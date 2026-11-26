import React, { useState } from 'react';
import { BellRing, Download, RotateCcw, Upload } from 'lucide-react';
import { ConfirmModal } from '../components/Modal';
import { useIkanara } from '../context/IkanaraContext';
import { formatDateTimeID, formatNumber } from '../domain/calculations';
import type { IkanaraState } from '../domain/types';
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  triggerBrowserNotification,
} from '../services/notifications';

export function SettingsPage() {
  const { role, state, mutate, restoreBackup, resetToDefault, pushToast } = useIkanara();

  const [farmName, setFarmName] = useState(state.settings.farmName);
  const [location, setLocation] = useState(state.settings.location);
  const [notifPerm, setNotifPerm] = useState(getBrowserNotificationPermission());
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSaveFarmInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await mutate(
      {
        type: 'UPDATE_SETTINGS',
        payload: {
          farmName,
          location,
        },
      },
      'Profil usaha & pengaturan berhasil disimpan'
    );
    setBusy(false);
  };

  const handleToggleBrowserNotifications = async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotifPerm(perm);
    if (perm === 'granted') {
      await mutate(
        {
          type: 'UPDATE_SETTINGS',
          payload: { browserNotificationsEnabled: true },
        },
        'Notifikasi browser diaktifkan'
      );
      triggerBrowserNotification(
        'Notifikasi IKANARA Aktif',
        'Anda akan menerima pengingat jadwal pakan, stok menipis, dan peringatan kesehatan ikan.'
      );
    } else {
      pushToast({
        type: 'info',
        title: 'Izin Notifikasi Browser',
        description: 'Browser belum mengizinkan notifikasi. Notifikasi in-app tetap aktif sepenuhnya.',
      });
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as IkanaraState;
      await restoreBackup(parsed);
    } catch {
      pushToast({
        type: 'error',
        title: 'File Cadangan Tidak Valid',
        description: 'Pastikan Anda memilih file backup JSON IKANARA yang valid.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleResetConfirm = async () => {
    setBusy(true);
    const ok = await resetToDefault();
    setBusy(false);
    if (ok) setResetConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan, Cadangan Data & Log Aktivitas
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Konfigurasi profil usaha, ambang ukuran ikan, notifikasi browser, pencadangan JSON, dan riwayat perubahan data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Farm Settings & Notifications */}
        <div className="lg:col-span-6 space-y-6">
          <form
            onSubmit={handleSaveFarmInfo}
            className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
          >
            <h2 className="text-sm font-semibold text-slate-900">Identitas Usaha Budidaya</h2>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Usaha / Sentra
              </label>
              <input
                type="text"
                required
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lokasi / Keterangan Fasilitas
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Simpan Pengaturan
              </button>
            </div>
          </form>

          {/* Notifications & Backup */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Notifikasi Otomatis</h2>
                <p className="mt-1 text-xs text-slate-600">
                  Notifikasi in-app selalu aktif. Aktifkan notifikasi browser untuk peringatan langsung saat halaman terbuka.
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Status izin browser: <strong className="text-slate-800">{notifPerm}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleBrowserNotifications}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50 shrink-0"
              >
                <BellRing className="h-4 w-4 text-sky-700" />
                Aktifkan Browser
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900">
                Pencadangan & Pemulihan Basis Data (Cloud / Lokal)
              </h3>
              <p className="text-xs text-slate-500">
                Revisi basis data saat ini: <strong className="font-mono-num text-slate-800">v{state.revision}</strong> · Diperbarui {formatDateTimeID(state.updatedAt)}
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4 text-sky-700" />
                  Unduh Backup JSON
                </button>

                <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 cursor-pointer">
                  <Upload className="h-4 w-4 text-slate-600" />
                  Pulihkan dari JSON
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleUploadBackup}
                    className="hidden"
                  />
                </label>

                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Data Awal
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Size Thresholds Configuration */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Konfigurasi Kategori Ukuran Ikan (per Jenis)
              </h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 font-medium">Jenis Ikan</th>
                  <th className="py-2 font-medium text-right">Maks Kecil (g)</th>
                  <th className="py-2 font-medium text-right">Maks Sedang (g)</th>
                  <th className="py-2 font-medium text-right">Min Panen (g)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.settings.sizeThresholds.map((st, idx) => (
                  <tr key={st.species}>
                    <td className="py-2 font-medium text-slate-900">{st.species}</td>
                    <td className="py-1.5 text-right">
                      <input
                        type="number"
                        min="1"
                        defaultValue={st.smallMaxGrams}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (!val || val === st.smallMaxGrams) return;
                          const next = state.settings.sizeThresholds.map((item, i) =>
                            i === idx ? { ...item, smallMaxGrams: val } : item
                          );
                          mutate(
                            { type: 'UPDATE_SETTINGS', payload: { sizeThresholds: next } },
                            `Batas ukuran ${st.species} diperbarui`
                          );
                        }}
                        className="w-20 rounded border border-slate-200 px-2 py-1 text-right font-mono-num text-slate-800"
                      />
                    </td>
                    <td className="py-1.5 text-right">
                      <input
                        type="number"
                        min="1"
                        defaultValue={st.mediumMaxGrams}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (!val || val === st.mediumMaxGrams) return;
                          const next = state.settings.sizeThresholds.map((item, i) =>
                            i === idx
                              ? { ...item, mediumMaxGrams: val, harvestReadyMinGrams: val + 1 }
                              : item
                          );
                          mutate(
                            { type: 'UPDATE_SETTINGS', payload: { sizeThresholds: next } },
                            `Batas ukuran ${st.species} diperbarui`
                          );
                        }}
                        className="w-20 rounded border border-slate-200 px-2 py-1 text-right font-mono-num text-slate-800"
                      />
                    </td>
                    <td className="py-2 text-right font-mono-num font-semibold text-emerald-700">
                      ≥ {formatNumber(st.harvestReadyMinGrams)} g
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Feeding Schedule Template Reference */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Konfigurasi Dosis Pakan Harian (per Jenis Ikan)
            </h2>
            <div className="space-y-3">
              {state.settings.feedingTemplates.map((tpl, tIdx) => (
                <div key={tpl.species} className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <p className="text-xs font-semibold text-sky-700 mb-1.5">{tpl.species}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {tpl.slots.map((slot, sIdx) => (
                      <div key={slot.slotLabel} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                        <span className="text-slate-700 truncate">
                          {slot.slotLabel} ({slot.timeWindow})
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          defaultValue={slot.defaultAmountKg}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (!val || val === slot.defaultAmountKg) return;
                            const nextTemplates = state.settings.feedingTemplates.map((t, i) =>
                              i === tIdx
                                ? {
                                    ...t,
                                    slots: t.slots.map((sl, j) =>
                                      j === sIdx ? { ...sl, defaultAmountKg: val } : sl
                                    ),
                                  }
                                : t
                            );
                            mutate(
                              {
                                type: 'UPDATE_SETTINGS',
                                payload: { feedingTemplates: nextTemplates },
                              },
                              `Dosis pakan ${tpl.species} (${slot.slotLabel}) diperbarui`
                            );
                          }}
                          className="w-14 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono-num"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Immutable Activity Logs for Owner Audit */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Riwayat Perubahan & Aktivitas Admin
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail seluruh pencatatan dan pembaruan data operasional.
              </p>
            </div>
            <span className="font-mono-num text-xs text-slate-500">
              {state.activityLogs.length} log
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {state.activityLogs.map((log) => (
              <div key={log.id} className="px-5 py-3 text-xs">
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-800">
                    {log.actorRole === 'owner' ? 'Owner' : 'Admin'} · {log.entityType}
                  </span>
                  <span className="font-mono-num">{formatDateTimeID(log.timestamp)}</span>
                </div>
                <p className="mt-1 text-slate-800 leading-relaxed">{log.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset Data ke Kondisi Awal"
        message="Seluruh transaksi baru akan dihapus dan dikembalikan ke data awal usaha IKANARA (Modal Rp20.000.000, 4 kolam, 550 bibit). Lanjutkan?"
        confirmLabel="Ya, Reset Data"
        destructive
        busy={busy}
      />
    </div>
  );
}
