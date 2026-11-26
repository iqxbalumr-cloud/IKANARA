import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useIkanara } from '../context/IkanaraContext';
import {
  computeDashboardMetrics,
  computePeriodFinancials,
  FISH_SPECIES_LIST,
  formatKg,
  formatNumber,
  formatRupiah,
} from '../domain/calculations';
import type { ReportPeriod } from '../domain/types';
import { downloadCsv } from '../utils/media';

export function ReportsPage() {
  const { state } = useIkanara();
  const [period, setPeriod] = useState<ReportPeriod>('bulanan');

  const m = computeDashboardMetrics(state);
  const fin = computePeriodFinancials(state, period);

  const handleExportCsv = () => {
    downloadCsv(
      `ikanara-laporan-${period}-${new Date().toISOString().slice(0, 10)}.csv`,
      ['ID Transaksi', 'Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Nominal (Rp)'],
      fin.filteredTx.map((t) => [
        t.id,
        t.date,
        t.type,
        t.category,
        t.description,
        t.amount,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laporan Operasional & Keuangan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ringkasan kinerja budidaya, efisiensi pakan, mortalitas, serta realisasi omzet dan keuntungan bersih untuk evaluasi Owner.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mr-1">
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

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Ekspor CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
          >
            <Printer className="h-4 w-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Pemasukan Periode ({period})</p>
          <p className="mt-1.5 text-xl font-bold font-mono-num text-emerald-700">
            {formatRupiah(fin.totalIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Pengeluaran Periode ({period})</p>
          <p className="mt-1.5 text-xl font-bold font-mono-num text-red-700">
            {formatRupiah(fin.totalExpense)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Keuntungan Bersih</p>
          <p className="mt-1.5 text-xl font-bold font-mono-num text-slate-900">
            {formatRupiah(fin.netProfit)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Tingkat Kelangsungan Hidup</p>
          <p className="mt-1.5 text-xl font-bold font-mono-num text-sky-700">
            {m.totalAliveFish + m.totalDeadFish + m.totalHarvestedFish > 0
              ? Math.round(
                  ((m.totalAliveFish + m.totalHarvestedFish) /
                    (m.totalAliveFish + m.totalDeadFish + m.totalHarvestedFish)) *
                    100
                )
              : 100}
            %
          </p>
        </div>
      </div>

      {/* Pond Production Report */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Laporan Populasi & Produksi per Kolam
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Kolam</th>
                <th className="px-5 py-3 font-medium">Jenis Ikan</th>
                <th className="px-5 py-3 font-medium text-right">Luas</th>
                <th className="px-5 py-3 font-medium text-right">Bibit Awal</th>
                <th className="px-5 py-3 font-medium text-right">Hidup</th>
                <th className="px-5 py-3 font-medium text-right">Mati</th>
                <th className="px-5 py-3 font-medium text-right">Dipanen</th>
                <th className="px-5 py-3 font-medium text-right">Siap Panen</th>
                <th className="px-5 py-3 font-medium">Kondisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.ponds.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {p.name} ({p.id})
                  </td>
                  <td className="px-5 py-3 text-slate-700">{p.species}</td>
                  <td className="px-5 py-3 text-right font-mono-num text-slate-600">
                    {p.areaSqm} m²
                  </td>
                  <td className="px-5 py-3 text-right font-mono-num text-slate-700">
                    {formatNumber(p.initialSeedCount)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono-num font-bold text-slate-900">
                    {formatNumber(p.currentPopulation)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono-num text-red-700">
                    {formatNumber(p.mortalityCount)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono-num text-emerald-700">
                    {formatNumber(p.harvestedCount)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono-num font-semibold text-sky-700">
                    {formatNumber(p.sizeDistribution.siapPanen)}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{p.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Target Report */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Laporan Pendapatan vs Target per Jenis Ikan
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Jenis Ikan</th>
                <th className="px-5 py-3 font-medium text-right">Realisasi ({period})</th>
                <th className="px-5 py-3 font-medium text-right">Target Mingguan</th>
                <th className="px-5 py-3 font-medium text-right">Target Bulanan</th>
                <th className="px-5 py-3 font-medium text-right">Target Tahunan</th>
                <th className="px-5 py-3 font-medium text-right">Pakan Keluar (Total)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FISH_SPECIES_LIST.map((sp) => {
                const t = state.settings.revenueTargets.find((r) => r.species === sp);
                const feedOut = state.feedTransactions
                  .filter((ft) => ft.type === 'keluar' && ft.species === sp)
                  .reduce((sum, ft) => sum + ft.amountKg, 0);
                return (
                  <tr key={sp}>
                    <td className="px-5 py-3 font-semibold text-slate-900">{sp}</td>
                    <td className="px-5 py-3 text-right font-mono-num font-bold text-emerald-700">
                      {formatRupiah(fin.revenueBySpecies[sp])}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-600">
                      {formatRupiah(t?.weekly ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-600">
                      {formatRupiah(t?.monthly ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-600">
                      {formatRupiah(t?.yearly ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num text-slate-700">
                      {formatKg(feedOut)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
