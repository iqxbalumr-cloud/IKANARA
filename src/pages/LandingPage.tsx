import { ArrowRight, ShieldCheck, UserCog } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { MediaImage } from '../components/MediaImage';
import { useIkanara } from '../context/IkanaraContext';
import { computeDashboardMetrics, FISH_SPECIES_LIST, formatNumber, formatRupiah } from '../domain/calculations';
import { FISH_IMAGES, FISH_SPECIES_NOTES, HERO_FARM_IMAGE } from '../utils/media';

export function LandingPage() {
  const { enterAsRole, state } = useIkanara();
  const metrics = computeDashboardMetrics(state);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <BrandMark />

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#ringkasan" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Ringkasan
            </a>
            <a href="#komoditas" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Komoditas
            </a>
            <a href="#kapasitas" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Kapasitas
            </a>
            <a href="#akses-peran" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Akses Peran
            </a>
          </nav>

          <button
            type="button"
            onClick={() => enterAsRole('owner')}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Masuk Dashboard
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Split */}
        <section id="ringkasan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <p className="text-sm font-medium text-sky-700">
                  Smart Fish Farm Management System
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12] [text-wrap:balance]">
                  Satu sistem terintegrasi untuk seluruh operasional budidaya ikan.
                </h1>
                <p className="text-base leading-relaxed text-slate-600 max-w-xl">
                  IKANARA membantu pemilik dan pengelola usaha memantau kolam, bibit, pakan, kesehatan ikan, pertumbuhan, jadwal perawatan, panen, penjualan, dan laporan keuangan secara akurat dalam satu basis data tersinkron.
                </p>
              </div>

              {/* Dual Role Entry Without Username/Password */}
              <div id="akses-peran" className="space-y-3 pt-2">
                <p className="text-xs font-semibold tracking-normal text-slate-500">
                  Pilih peran akses untuk masuk langsung ke sistem:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => enterAsRole('owner')}
                    className="group flex flex-col justify-between rounded-xl border border-slate-900 bg-slate-900 p-5 text-left text-white hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <ShieldCheck className="h-5 w-5 text-sky-400" />
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="mt-4">
                      <span className="block text-base font-semibold whitespace-nowrap">
                        Masuk sebagai Owner
                      </span>
                      <span className="mt-1 block text-xs text-slate-300 leading-relaxed">
                        Pantau dashboard, populasi, stok pakan, keuangan, dan aktivitas Admin.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => enterAsRole('admin')}
                    className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <UserCog className="h-5 w-5 text-sky-700" />
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="mt-4">
                      <span className="block text-base font-semibold whitespace-nowrap">
                        Masuk sebagai Admin
                      </span>
                      <span className="mt-1 block text-xs text-slate-600 leading-relaxed">
                        Kelola kolam, bibit, pakan, kesehatan, pertumbuhan, panen, dan kas.
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <MediaImage
                  src={HERO_FARM_IMAGE}
                  alt="Fasilitas Kolam Budidaya Ikan Modern IKANARA"
                  fallbackLabel="Sentra Budidaya Kolam Terpadu IKANARA"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent p-6 text-white">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sky-200">
                    <span>4 Kolam Aktif</span>
                    <span aria-hidden="true">·</span>
                    <span>Total Luas {metrics.totalAreaSqm} m²</span>
                    <span aria-hidden="true">·</span>
                    <span>Sinkronisasi Web & iOS</span>
                  </div>
                  <p className="mt-1 text-base font-semibold">
                    {state.settings.farmName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width 4-column summary strip */}
          <div
            id="kapasitas"
            className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200 pt-8"
          >
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium text-slate-500">Modal Usaha Awal</p>
              <p className="mt-1.5 text-xl font-bold text-slate-900 font-mono-num">
                {formatRupiah(metrics.totalInitialCapital)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Teralokasi dalam 9 pos usaha</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium text-slate-500">Total Populasi Hidup</p>
              <p className="mt-1.5 text-xl font-bold text-slate-900 font-mono-num">
                {formatNumber(metrics.totalAliveFish)} ekor
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {metrics.activePondCount} kolam · {metrics.totalAreaSqm} m² aktif
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium text-slate-500">Persediaan Pakan</p>
              <p className="mt-1.5 text-xl font-bold text-sky-700 font-mono-num">
                {formatNumber(metrics.totalFeedStockKg)} kg
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Kontrol stok & pengingat otomatis
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium text-slate-500">Target Omzet Bulanan</p>
              <p className="mt-1.5 text-xl font-bold text-slate-900 font-mono-num">
                {formatRupiah(metrics.monthlyTargetTotal)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Target tahunan {formatRupiah(metrics.yearlyTargetTotal)}
              </p>
            </div>
          </div>
        </section>

        {/* 4 Supported Fish Commodities */}
        <section id="komoditas" className="border-t border-slate-200 bg-slate-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Empat komoditas budidaya terkelola
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Pemantauan terpisah per kolam dan jenis ikan untuk pakan, pertumbuhan dua mingguan, kesehatan, hingga target penjualan.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FISH_SPECIES_LIST.map((species) => {
                const pond = state.ponds.find((p) => p.species === species);
                const target = state.settings.revenueTargets.find((r) => r.species === species);
                return (
                  <article
                    key={species}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                      <MediaImage
                        src={FISH_IMAGES[species]}
                        alt={`Ikan ${species}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{pond ? `${pond.lengthMeters} × ${pond.widthMeters} m` : 'Budidaya Aktif'}</span>
                          <span className="font-mono-num text-sky-700 font-medium">
                            {formatNumber(metrics.populationBySpecies[species])} ekor
                          </span>
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">
                          {species}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {FISH_SPECIES_NOTES[species]}
                        </p>
                      </div>
                      {target && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Target mingguan</span>
                          <span className="font-mono-num font-semibold text-slate-900">
                            {formatRupiah(target.weekly)}
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>IKANARA – Smart Fish Farm Management System</span>
          <span>Satu aplikasi untuk mengelola seluruh kegiatan budidaya ikan secara terintegrasi.</span>
        </div>
      </footer>
    </div>
  );
}
