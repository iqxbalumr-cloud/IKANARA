import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  Droplets,
  FileSpreadsheet,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Scale,
  Settings,
  ShoppingBag,
  Sprout,
  TrendingUp,
  Wallet,
  Waves,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import { useIkanara, type NavSectionId } from '../context/IkanaraContext';
import { formatDateTimeID } from '../domain/calculations';
import { BrandMark } from './BrandMark';

interface NavItem {
  id: NavSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kolam', label: 'Data Kolam', icon: Waves },
  { id: 'bibit', label: 'Data Bibit', icon: Sprout },
  { id: 'pakan', label: 'Manajemen Pakan', icon: Package },
  { id: 'kesehatan', label: 'Kesehatan Ikan', icon: HeartPulse },
  { id: 'pertumbuhan', label: 'Pertumbuhan Ikan', icon: TrendingUp },
  { id: 'perawatan', label: 'Perawatan Kolam', icon: Wrench },
  { id: 'jadwal', label: 'Jadwal Kegiatan', icon: CalendarClock },
  { id: 'panen', label: 'Panen', icon: Scale },
  { id: 'penjualan', label: 'Penjualan', icon: ShoppingBag },
  { id: 'keuangan', label: 'Keuangan', icon: Wallet },
  { id: 'laporan', label: 'Laporan', icon: BarChart3 },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    role,
    state,
    syncStatus,
    pendingQueueCount,
    activeNav,
    selectedPondId,
    navigateTo,
    logoutRole,
    enterAsRole,
    mutate,
    refreshState,
  } = useIkanara();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const visibleNotifications = useMemo(() => {
    return state.notifications.filter(
      (n) => n.targetRole === 'all' || n.targetRole === role
    );
  }, [role, state.notifications]);

  const unreadCount = useMemo(
    () => visibleNotifications.filter((n) => !n.isRead).length,
    [visibleNotifications]
  );

  const activeNavMeta = NAV_ITEMS.find((item) => item.id === activeNav) ?? NAV_ITEMS[0];
  const selectedPond = selectedPondId
    ? state.ponds.find((p) => p.id === selectedPondId)
    : null;

  const handleNavClick = (id: NavSectionId) => {
    navigateTo(id, null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white z-30">
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200">
          <BrandMark />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-sky-300' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Peran Aktif</span>
              <span className="font-semibold text-slate-900">
                {role === 'owner' ? 'Owner' : 'Admin'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hak Akses</span>
              <span className="text-slate-700">
                {role === 'owner' ? 'Pengawasan Penuh' : 'Operasional Penuh'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => enterAsRole(role === 'owner' ? 'admin' : 'owner')}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Beralih ke {role === 'owner' ? 'Admin' : 'Owner'}
            </button>
            <button
              type="button"
              onClick={logoutRole}
              title="Kembali ke Halaman Awal"
              aria-label="Keluar ke Halaman Awal"
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200">
              <BrandMark />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-sky-300' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="border-t border-slate-200 p-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  enterAsRole(role === 'owner' ? 'admin' : 'owner');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Beralih ke {role === 'owner' ? 'Admin' : 'Owner'}
              </button>
              <button
                type="button"
                onClick={logoutRole}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Keluar
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Bar: Clean 3-zone header */}
        <header className="sticky top-0 z-20 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka navigasi"
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-slate-900 truncate">
                {activeNavMeta.label}
              </span>
              {selectedPond && activeNav === 'kolam' && (
                <>
                  <span className="text-slate-300" aria-hidden="true">/</span>
                  <span className="text-slate-600 truncate">
                    {selectedPond.name} ({selectedPond.id})
                  </span>
                </>
              )}
              <span className="hidden md:inline text-slate-300" aria-hidden="true">·</span>
              <span className="hidden md:inline text-xs text-slate-500 whitespace-nowrap">
                {role === 'owner' ? 'Mode Pengawasan Owner' : 'Mode Operasional Admin'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Sync / Offline state only shown functionally */}
            <button
              type="button"
              onClick={refreshState}
              title="Sinkronkan data terbaru"
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                syncStatus === 'offline'
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {syncStatus === 'offline' ? (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                  <span>Luring{pendingQueueCount > 0 ? ` (${pendingQueueCount} antre)` : ''}</span>
                </>
              ) : (
                <>
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-sky-600 ${
                      syncStatus === 'syncing' ? 'animate-spin' : ''
                    }`}
                  />
                  <span>{syncStatus === 'syncing' ? 'Menyinkronkan' : 'Tersinkron'}</span>
                </>
              )}
            </button>

            {/* Notification Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Buka notifikasi"
                className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Bell className="h-4 w-4 text-slate-600" />
                <span className="hidden sm:inline">Notifikasi</span>
                {unreadCount > 0 && (
                  <span className="font-mono-num font-semibold text-sky-700">
                    ({unreadCount})
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-40 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                      <span className="text-sm font-semibold text-slate-900">
                        Notifikasi Sistem
                      </span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            mutate({
                              type: 'MARK_NOTIFICATION_READ',
                              payload: { markAll: true },
                            })
                          }
                          className="text-xs font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                      {visibleNotifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                          Belum ada notifikasi baru.
                        </div>
                      ) : (
                        visibleNotifications.slice(0, 12).map((notif) => (
                          <button
                            key={notif.id}
                            type="button"
                            onClick={() => {
                              if (!notif.isRead) {
                                mutate({
                                  type: 'MARK_NOTIFICATION_READ',
                                  payload: { notificationId: notif.id },
                                });
                              }
                              if (notif.pondId) {
                                navigateTo('kolam', notif.pondId);
                                setNotifOpen(false);
                              }
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                              notif.isRead ? 'bg-white' : 'bg-sky-50/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-semibold ${
                                  notif.severity === 'critical'
                                    ? 'text-red-700'
                                    : notif.severity === 'warning'
                                      ? 'text-amber-700'
                                      : 'text-sky-700'
                                }`}
                              >
                                {notif.severity === 'critical'
                                  ? 'Kritis'
                                  : notif.severity === 'warning'
                                    ? 'Peringatan'
                                    : 'Info'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono-num">
                                {formatDateTimeID(notif.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {notif.title}
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                              {notif.message}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={logoutRole}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Ganti Peran
            </button>
          </div>
        </header>

        {/* Offline Warning Banner when disconnected */}
        {syncStatus === 'offline' && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 sm:px-6 lg:px-8 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-4">
            <span>
              Koneksi server terputus. Anda tetap dapat membaca data terakhir; perubahan baru disimpan di antrean luring agar tidak hilang atau tercatat ganda.
            </span>
            <button
              type="button"
              onClick={refreshState}
              className="font-semibold underline hover:text-amber-950 whitespace-nowrap shrink-0"
            >
              Coba Sinkronkan
            </button>
          </div>
        )}

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
