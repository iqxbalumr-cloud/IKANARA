import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Droplets,
  Package,
  Scale,
  Sprout,
  Wallet,
  Waves,
} from 'lucide-react';
import { useIkanara } from '../context/IkanaraContext';
import {
  computeDashboardMetrics,
  FISH_SPECIES_LIST,
  formatDateID,
  formatDateTimeID,
  formatKg,
  formatNumber,
  formatRupiah,
} from '../domain/calculations';

export function DashboardPage() {
  const { role, state, navigateTo } = useIkanara();
  const m = computeDashboardMetrics(state);

  const todayFeedingSchedules = state.feedingSchedules.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-medium text-sky-700">
            {role === 'owner' ? 'Ringkasan Eksekutif Owner' : 'Ringkasan Operasional Admin'}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Usaha Budidaya IKANARA
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pantau kondisi kolam, populasi ikan, stok pakan, jadwal harian, dan posisi keuangan dalam angka terpadu.
          </p>
        </div>

        {role === 'admin' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('jadwal')}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Jadwal Pakan
            </button>
            <button
              type="button"
              onClick={() => navigateTo('panen')}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Catat Panen & Penjualan
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigateTo('laporan')}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Buka Laporan Lengkap
          </button>
        )}
      </div>

      {/* Operational Alerts Strip (only shown if any active warnings exist) */}
      {(m.sickRecordsActive.length > 0 || m.lowStockFeeds.length > 0 || m.missedSchedulesCount > 0) && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Peringatan Operasional Aktif</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {m.sickRecordsActive.length > 0 && (
              <button
                type="button"
                onClick={() => navigateTo('kesehatan')}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-white px-3.5 py-2.5 text-left hover:bg-red-50/40 transition-colors"
              >
                <div>
                  <span className="font-semibold text-red-700 block">
                    {m.sickRecordsActive.length} Kasus Ikan Sakit
                  </span>
                  <span className="text-slate-600">
                    Periksa penanganan kolam {m.sickRecordsActive[0].pondId}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-red-600 shrink-0" />
              </button>
            )}
            {m.lowStockFeeds.length > 0 && (
              <button
                type="button"
                onClick={() => navigateTo('pakan')}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3.5 py-2.5 text-left hover:bg-amber-50/50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-amber-800 block">
                    {m.lowStockFeeds.length} Stok Pakan Menipis
                  </span>
                  <span className="text-slate-600">
                    {m.lowStockFeeds[0].name} tersisa {formatKg(m.lowStockFeeds[0].stockKg)}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-700 shrink-0" />
              </button>
            )}
            {m.missedSchedulesCount > 0 && (
              <button
                type="button"
                onClick={() => navigateTo('jadwal')}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3.5 py-2.5 text-left hover:bg-amber-50/50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-amber-800 block">
                    {m.missedSchedulesCount} Jadwal Pakan Terlewat
                  </span>
                  <span className="text-slate-600">Tinjau jadwal pemberian pakan</span>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-700 shrink-0" />
              </button>
            )}
          </div>
        </section>
      )}

      {/* 1. Informasi Keuangan (PRD 5.1) */}
      <section aria-labelledby="sec-keuangan">
        <div className="flex items-center justify-between mb-3">
          <h2 id="sec-keuangan" className="text-sm font-semibold text-slate-900">
            Informasi Keuangan
          </h2>
          <button
            type="button"
            onClick={() => navigateTo('keuangan')}
            className="text-xs font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
          >
            Rincian Keuangan
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Saldo Kas Operasional</span>
              <Wallet className="h-4 w-4 text-sky-700" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 font-mono-num">
              {formatRupiah(m.cashBalance)}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Modal awal {formatRupiah(m.totalInitialCapital)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Biaya Operasional</span>
              <span className="text-slate-400">Pengeluaran</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 font-mono-num">
              {formatRupiah(m.totalExpensesAllTime)}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Pemasukan tercatat {formatRupiah(m.totalIncomeAllTime)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Estimasi Keuntungan Bersih</span>
              <span
                className={`font-medium ${
                  m.netProfitAllTime >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {m.netProfitAllTime >= 0 ? 'Surplus' : 'Defisit Operasional'}
              </span>
            </div>
            <p
              className={`mt-2 text-2xl font-bold font-mono-num ${
                m.netProfitAllTime >= 0 ? 'text-emerald-700' : 'text-slate-900'
              }`}
            >
              {formatRupiah(m.netProfitAllTime)}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Pemasukan dikurangi pengeluaran
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Omzet Penjualan</span>
              <span className="text-sky-700 font-medium">Periode Berjalan</span>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Mingguan</span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {formatRupiah(m.weeklyRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Bulanan</span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {formatRupiah(m.monthlyRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tahunan</span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {formatRupiah(m.yearlyRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Informasi Kolam & Populasi (PRD 5.1) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Populasi Ikan */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Informasi Populasi Ikan</h2>
              <Sprout className="h-4 w-4 text-sky-700" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Total Ikan Hidup</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 font-mono-num">
                  {formatNumber(m.totalAliveFish)}
                </p>
                <p className="text-[11px] text-slate-500">ekor aktif</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Ikan Mati</p>
                <p className="mt-1 text-2xl font-bold text-red-700 font-mono-num">
                  {formatNumber(m.totalDeadFish)}
                </p>
                <p className="text-[11px] text-slate-500">
                  tercatat · dipanen {formatNumber(m.totalHarvestedFish)} ekor
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 text-sm">
              <p className="text-xs font-medium text-slate-500">Distribusi Ukuran Populasi</p>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-700">Ukuran Kecil</span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {formatNumber(m.sizeTotals.kecil)} ekor
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-700">Ukuran Sedang</span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {formatNumber(m.sizeTotals.sedang)} ekor
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="font-medium text-emerald-700">Ukuran Siap Panen</span>
                <span className="font-mono-num font-bold text-emerald-700">
                  {formatNumber(m.sizeTotals.siapPanen)} ekor
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Kolam per jenis: Lele ({m.pondsBySpecies.Lele}) · Nila ({m.pondsBySpecies.Nila}) · Emas ({m.pondsBySpecies['Ikan emas']}) · Patin ({m.pondsBySpecies.Patin})</span>
          </div>
        </div>

        {/* Informasi Kondisi Setiap Kolam */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Informasi Kolam ({m.activePondCount} Kolam Aktif · {m.totalAreaSqm} m²)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik kolam untuk membuka halaman detail lengkap beserta riwayatnya.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('kolam')}
              className="text-xs font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
            >
              Kelola Kolam
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {state.ponds.map((pond) => (
              <button
                key={pond.id}
                type="button"
                onClick={() => navigateTo('kolam', pond.id)}
                className="w-full py-3.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span>{pond.name}</span>
                    <span className="font-mono-num text-xs font-normal text-slate-500">
                      {pond.id}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{pond.species}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {pond.lengthMeters} × {pond.widthMeters} m ({pond.areaSqm} m²)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-sky-700">
                      <Droplets className="h-3 w-3" />
                      {pond.waterStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold font-mono-num text-slate-900">
                      {formatNumber(pond.currentPopulation)} ekor
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono-num">
                      Siap panen: {formatNumber(pond.sizeDistribution.siapPanen)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
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
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Informasi Operasional & Target Pendapatan */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Jadwal & Operasional Terdekat */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Informasi Operasional & Jadwal Pakan
            </h2>
            <button
              type="button"
              onClick={() => navigateTo('jadwal')}
              className="text-xs font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
            >
              Semua Jadwal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-100 text-xs">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Scale className="h-3.5 w-3.5 text-sky-700" />
                <span>Jadwal Panen Terdekat</span>
              </div>
              <p className="mt-1 font-semibold text-slate-900">
                {m.nearestHarvestPond
                  ? `${m.nearestHarvestPond.name} · ${formatDateID(m.nearestHarvestPond.estimatedHarvestDate)}`
                  : 'Belum dijadwalkan'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Package className="h-3.5 w-3.5 text-sky-700" />
                <span>Total Stok Pakan</span>
              </div>
              <p className="mt-1 font-semibold font-mono-num text-slate-900">
                {formatKg(m.totalFeedStockKg)} ({m.lowStockFeeds.length} peringatan)
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('perawatan')}
              className="rounded-lg bg-slate-50 p-3 text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-slate-500">
                <Waves className="h-3.5 w-3.5 text-sky-700" />
                <span>Jadwal Perawatan</span>
              </div>
              <p className="mt-1 font-semibold text-slate-900">
                {state.maintenanceRecords[0]
                  ? `${state.maintenanceRecords[0].frequency} · ${formatDateID(state.maintenanceRecords[0].date)}`
                  : 'Harian · Mingguan'}
              </p>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {todayFeedingSchedules.map((sch) => (
              <div
                key={sch.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {sch.pondId} · {sch.species} ({sch.slotLabel})
                  </p>
                  <p className="text-slate-500 font-mono-num">
                    {sch.timeWindow} · {formatKg(sch.plannedAmountKg)}
                  </p>
                </div>
                <span
                  className={`font-semibold whitespace-nowrap ${
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
              </div>
            ))}
          </div>
        </div>

        {/* Target Pendapatan & Aktivitas Admin */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Realisasi vs Target Pendapatan Mingguan
              </h2>
              <button
                type="button"
                onClick={() => navigateTo('penjualan')}
                className="text-xs font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
              >
                Detail Penjualan
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 font-medium">Jenis Ikan</th>
                    <th className="py-2 font-medium text-right">Realisasi</th>
                    <th className="py-2 font-medium text-right">Target Mingguan</th>
                    <th className="py-2 font-medium text-right">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {FISH_SPECIES_LIST.map((species) => {
                    const target =
                      state.settings.revenueTargets.find((r) => r.species === species)?.weekly ?? 0;
                    const actual = state.salesTransactions
                      .filter((s) => s.species === species)
                      .reduce((sum, s) => sum + s.totalAmount, 0);
                    const pct = target > 0 ? Math.min(999, Math.round((actual / target) * 100)) : 0;
                    return (
                      <tr key={species}>
                        <td className="py-2.5 font-medium text-slate-900">{species}</td>
                        <td className="py-2.5 text-right font-mono-num text-slate-900">
                          {formatRupiah(actual)}
                        </td>
                        <td className="py-2.5 text-right font-mono-num text-slate-500">
                          {formatRupiah(target)}
                        </td>
                        <td className="py-2.5 text-right font-mono-num font-semibold text-sky-700">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Aktivitas Operasional Terbaru
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('pengaturan')}
                className="text-xs font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
              >
                Log Lengkap
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {state.activityLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="py-2.5 text-xs">
                  <p className="text-slate-800">{log.summary}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400 font-mono-num">
                    {log.actorRole === 'owner' ? 'Owner' : 'Admin'} · {formatDateTimeID(log.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
