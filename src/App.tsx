import { AppShell } from './components/AppShell';
import { ToastViewport } from './components/ToastViewport';
import { IkanaraProvider, useIkanara } from './context/IkanaraContext';
import { DashboardPage } from './pages/DashboardPage';
import { FeedPage } from './pages/FeedPage';
import { FinancePage } from './pages/FinancePage';
import { GrowthPage } from './pages/GrowthPage';
import { HarvestPage } from './pages/HarvestPage';
import { HealthPage } from './pages/HealthPage';
import { LandingPage } from './pages/LandingPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { PondsPage } from './pages/PondsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SalesPage } from './pages/SalesPage';
import { SchedulePage } from './pages/SchedulePage';
import { SeedsPage } from './pages/SeedsPage';
import { SettingsPage } from './pages/SettingsPage';

function IkanaraRouter() {
  const { role, activeNav } = useIkanara();

  if (!role) {
    return <LandingPage />;
  }

  return (
    <AppShell>
      {activeNav === 'dashboard' && <DashboardPage />}
      {activeNav === 'kolam' && <PondsPage />}
      {activeNav === 'bibit' && <SeedsPage />}
      {activeNav === 'pakan' && <FeedPage />}
      {activeNav === 'kesehatan' && <HealthPage />}
      {activeNav === 'pertumbuhan' && <GrowthPage />}
      {activeNav === 'perawatan' && <MaintenancePage />}
      {activeNav === 'jadwal' && <SchedulePage />}
      {activeNav === 'panen' && <HarvestPage />}
      {activeNav === 'penjualan' && <SalesPage />}
      {activeNav === 'keuangan' && <FinancePage />}
      {activeNav === 'laporan' && <ReportsPage />}
      {activeNav === 'pengaturan' && <SettingsPage />}
    </AppShell>
  );
}

export default function App() {
  return (
    <IkanaraProvider>
      <IkanaraRouter />
      <ToastViewport />
    </IkanaraProvider>
  );
}
