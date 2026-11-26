import { useState } from 'react';
import { CalendarPlus, Check, Clock, Play, XCircle } from 'lucide-react';
import { useIkanara } from '../context/IkanaraContext';
import { formatDateID, formatKg } from '../domain/calculations';
import type { ScheduleStatus } from '../domain/types';

export function SchedulePage() {
  const { role, state, mutate } = useIkanara();

  const [statusFilter, setStatusFilter] = useState<'Semua' | ScheduleStatus>('Semua');
  const [selectedDate, setSelectedDate] = useState(
    state.feedingSchedules[0]?.date ?? new Date().toISOString().slice(0, 10)
  );

  const filtered = state.feedingSchedules.filter((s) =>
    statusFilter === 'Semua' ? true : s.status === statusFilter
  );

  const updateStatus = async (scheduleId: string, status: ScheduleStatus, plannedKg?: number) => {
    await mutate(
      {
        type: 'UPDATE_FEEDING_SCHEDULE',
        payload: {
          scheduleId,
          status,
          actualAmountKg: plannedKg,
          deductFeedStock: status === 'Selesai',
        },
      },
      `Status jadwal diperbarui menjadi "${status}"`
    );
  };

  const handleGenerateDaily = async () => {
    await mutate(
      {
        type: 'GENERATE_DAILY_SCHEDULES',
        payload: { date: selectedDate },
      },
      `Jadwal pakan harian untuk ${formatDateID(selectedDate)} disiapkan`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Jadwal Kegiatan & Pemberian Pakan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Jadwal pakan terstandar (termasuk Lele 07.00–08.00, 12.00–13.00, 16.00–17.00) dengan pemotongan stok pakan otomatis saat selesai.
          </p>
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono-num text-slate-900"
            />
            <button
              type="button"
              onClick={handleGenerateDaily}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <CalendarPlus className="h-4 w-4" />
              Buat Jadwal Harian
            </button>
          </div>
        )}
      </div>

      {/* Reference Schedule Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.settings.feedingTemplates.map((tpl) => (
          <div key={tpl.species} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-sky-700">{tpl.species}</p>
            <div className="mt-2 space-y-1.5 text-xs">
              {tpl.slots.map((slot) => (
                <div
                  key={slot.slotLabel}
                  className="flex items-center justify-between border-b border-slate-100 pb-1 last:border-0 last:pb-0"
                >
                  <span className="text-slate-700">{slot.slotLabel}</span>
                  <span className="font-mono-num text-slate-900">
                    {slot.timeWindow} ({formatKg(slot.defaultAmountKg)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Execution Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Daftar Jadwal Pemberian Pakan ({filtered.length})
          </h2>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              ['Semua', 'Belum dilakukan', 'Sedang dilakukan', 'Selesai', 'Terlewat'] as const
            ).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Kolam / Ikan</th>
                <th className="px-5 py-3 font-medium">Waktu</th>
                <th className="px-5 py-3 font-medium text-right">Dosis Pakan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {role === 'admin' && <th className="px-5 py-3 font-medium text-right">Tindakan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Tidak ada jadwal pada filter status ini.
                  </td>
                </tr>
              ) : (
                filtered.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono-num text-slate-600 whitespace-nowrap">
                      {formatDateID(sch.date)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {sch.pondId} · {sch.species}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-medium text-slate-900">{sch.slotLabel}</span>
                      <span className="ml-2 font-mono-num text-slate-500">{sch.timeWindow}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num font-semibold text-slate-900">
                      {formatKg(sch.actualAmountKg ?? sch.plannedAmountKg)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          sch.status === 'Selesai'
                            ? 'text-emerald-700'
                            : sch.status === 'Sedang dilakukan'
                              ? 'text-sky-700'
                              : sch.status === 'Terlewat'
                                ? 'text-red-700'
                                : 'text-amber-700'
                        }`}
                      >
                        {sch.status}
                      </span>
                    </td>
                    {role === 'admin' && (
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {sch.status !== 'Sedang dilakukan' && sch.status !== 'Selesai' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(sch.id, 'Sedang dilakukan')}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Play className="h-3 w-3 text-sky-700" />
                              Mulai
                            </button>
                          )}
                          {sch.status !== 'Selesai' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateStatus(sch.id, 'Selesai', sch.plannedAmountKg)
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800"
                            >
                              <Check className="h-3 w-3" />
                              Selesai
                            </button>
                          )}
                          {sch.status === 'Belum dilakukan' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(sch.id, 'Terlewat')}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3" />
                              Terlewat
                            </button>
                          )}
                          {sch.status === 'Selesai' && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                              <Clock className="h-3 w-3" />
                              Stok Terpotong
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
