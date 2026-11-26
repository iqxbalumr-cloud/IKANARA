import type {
  FishSpecies,
  IkanaraState,
  ReportPeriod,
} from './types';

export const FISH_SPECIES_LIST: FishSpecies[] = ['Lele', 'Nila', 'Ikan emas', 'Patin'];

export function formatRupiah(value: number): string {
  const rounded = Math.round(value);
  const abs = Math.abs(rounded);
  const formatted = abs.toLocaleString('id-ID');
  return rounded < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}

export function formatKg(value: number): string {
  return `${value.toLocaleString('id-ID', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} kg`;
}

export function formatDateID(isoDate: string): string {
  if (!isoDate) return '-';
  const parsed = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeID(isoTimestamp: string): string {
  if (!isoTimestamp) return '-';
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return isoTimestamp;
  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getReferenceNow(): Date {
  // Use current system clock for live date filtering
  return new Date();
}

export function isDateInPeriod(isoDate: string, period: ReportPeriod, referenceDate = new Date()): boolean {
  if (period === 'semua') return true;
  const target = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(target.getTime())) return false;

  const ref = new Date(referenceDate);
  const diffMs = ref.getTime() - target.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (period === 'mingguan') {
    return diffDays >= -1 && diffDays <= 7;
  }
  if (period === 'bulanan') {
    return (
      target.getFullYear() === ref.getFullYear() &&
      target.getMonth() === ref.getMonth()
    ) || (diffDays >= 0 && diffDays <= 30);
  }
  if (period === 'tahunan') {
    return target.getFullYear() === ref.getFullYear();
  }
  return true;
}

export interface DashboardMetrics {
  activePondCount: number;
  totalAreaSqm: number;
  totalAliveFish: number;
  totalDeadFish: number;
  totalHarvestedFish: number;
  sizeTotals: {
    kecil: number;
    sedang: number;
    siapPanen: number;
  };
  pondsBySpecies: Record<FishSpecies, number>;
  populationBySpecies: Record<FishSpecies, number>;
  totalInitialCapital: number;
  totalSeedCost: number;
  seedReserveRemaining: number;
  totalFeedStockKg: number;
  lowStockFeeds: IkanaraState['feedInventory'];
  sickRecordsActive: IkanaraState['healthRecords'];
  pendingSchedulesToday: number;
  missedSchedulesCount: number;
  nearestHarvestPond: IkanaraState['ponds'][number] | null;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalIncomeAllTime: number;
  totalExpensesAllTime: number;
  netProfitAllTime: number;
  cashBalance: number;
  weeklyTargetTotal: number;
  monthlyTargetTotal: number;
  yearlyTargetTotal: number;
}

export function computeDashboardMetrics(state: IkanaraState): DashboardMetrics {
  const activePonds = state.ponds.filter((p) => p.isActive);
  const totalAreaSqm = activePonds.reduce((sum, p) => sum + p.areaSqm, 0);
  const totalAliveFish = activePonds.reduce((sum, p) => sum + p.currentPopulation, 0);
  const totalDeadFish = activePonds.reduce((sum, p) => sum + p.mortalityCount, 0);
  const totalHarvestedFish = activePonds.reduce((sum, p) => sum + p.harvestedCount, 0);

  const sizeTotals = activePonds.reduce(
    (acc, pond) => ({
      kecil: acc.kecil + pond.sizeDistribution.kecil,
      sedang: acc.sedang + pond.sizeDistribution.sedang,
      siapPanen: acc.siapPanen + pond.sizeDistribution.siapPanen,
    }),
    { kecil: 0, sedang: 0, siapPanen: 0 }
  );

  const pondsBySpecies: Record<FishSpecies, number> = {
    Lele: 0,
    Nila: 0,
    'Ikan emas': 0,
    Patin: 0,
  };
  const populationBySpecies: Record<FishSpecies, number> = {
    Lele: 0,
    Nila: 0,
    'Ikan emas': 0,
    Patin: 0,
  };

  for (const pond of activePonds) {
    pondsBySpecies[pond.species] = (pondsBySpecies[pond.species] || 0) + 1;
    populationBySpecies[pond.species] = (populationBySpecies[pond.species] || 0) + pond.currentPopulation;
  }

  const totalSeedCost = state.seedBatches.reduce((sum, b) => sum + b.purchaseCost, 0);
  const seedBudgetAllocated = state.settings.capitalAllocations
    .filter((c) => c.category === 'Bibit')
    .reduce((sum, c) => sum + c.amount, 0);
  const seedReserveRemaining = Math.max(0, seedBudgetAllocated - totalSeedCost);

  const totalFeedStockKg = state.feedInventory.reduce((sum, f) => sum + f.stockKg, 0);
  const lowStockFeeds = state.feedInventory.filter((f) => f.stockKg <= f.minThresholdKg);
  const sickRecordsActive = state.healthRecords.filter((h) => h.isSick && !h.resolved);

  const pendingSchedulesToday = state.feedingSchedules.filter(
    (s) => s.status === 'Belum dilakukan' || s.status === 'Sedang dilakukan'
  ).length;
  const missedSchedulesCount = state.feedingSchedules.filter((s) => s.status === 'Terlewat').length;

  const sortedHarvestPonds = [...activePonds]
    .filter((p) => p.currentPopulation > 0 && p.estimatedHarvestDate)
    .sort((a, b) => a.estimatedHarvestDate.localeCompare(b.estimatedHarvestDate));
  const nearestHarvestPond = sortedHarvestPonds[0] ?? null;

  const now = getReferenceNow();
  const weeklyRevenue = state.salesTransactions
    .filter((s) => isDateInPeriod(s.date, 'mingguan', now))
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const monthlyRevenue = state.salesTransactions
    .filter((s) => isDateInPeriod(s.date, 'bulanan', now))
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const yearlyRevenue = state.salesTransactions
    .filter((s) => isDateInPeriod(s.date, 'tahunan', now))
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const totalIncomeAllTime = state.financialTransactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpensesAllTime = state.financialTransactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  const netProfitAllTime = totalIncomeAllTime - totalExpensesAllTime;

  // Saldo kas operasional berasal dari sisa dana cadangan & operasional awal + pemasukan - pengeluaran
  const operationalAndReserveBase = state.settings.capitalAllocations
    .filter((c) => c.category === 'Operasional' || c.category === 'Cadangan')
    .reduce((sum, c) => sum + c.amount, 0) + seedReserveRemaining;
  const cashBalance = operationalAndReserveBase + totalIncomeAllTime - totalExpensesAllTime;

  const weeklyTargetTotal = state.settings.revenueTargets.reduce((s, r) => s + r.weekly, 0);
  const monthlyTargetTotal = state.settings.revenueTargets.reduce((s, r) => s + r.monthly, 0);
  const yearlyTargetTotal = state.settings.revenueTargets.reduce((s, r) => s + r.yearly, 0);

  return {
    activePondCount: activePonds.length,
    totalAreaSqm,
    totalAliveFish,
    totalDeadFish,
    totalHarvestedFish,
    sizeTotals,
    pondsBySpecies,
    populationBySpecies,
    totalInitialCapital: state.settings.totalInitialCapital,
    totalSeedCost,
    seedReserveRemaining,
    totalFeedStockKg,
    lowStockFeeds,
    sickRecordsActive,
    pendingSchedulesToday,
    missedSchedulesCount,
    nearestHarvestPond,
    weeklyRevenue,
    monthlyRevenue,
    yearlyRevenue,
    totalIncomeAllTime,
    totalExpensesAllTime,
    netProfitAllTime,
    cashBalance,
    weeklyTargetTotal,
    monthlyTargetTotal,
    yearlyTargetTotal,
  };
}

export function computePeriodFinancials(state: IkanaraState, period: ReportPeriod) {
  const now = getReferenceNow();
  const filteredTx = state.financialTransactions.filter((t) =>
    isDateInPeriod(t.date, period, now)
  );
  const totalIncome = filteredTx
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTx
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const salesInPeriod = state.salesTransactions.filter((s) =>
    isDateInPeriod(s.date, period, now)
  );

  const revenueBySpecies: Record<FishSpecies, number> = {
    Lele: 0,
    Nila: 0,
    'Ikan emas': 0,
    Patin: 0,
  };

  for (const sale of salesInPeriod) {
    revenueBySpecies[sale.species] = (revenueBySpecies[sale.species] || 0) + sale.totalAmount;
  }

  return {
    filteredTx,
    salesInPeriod,
    totalIncome,
    totalExpense,
    netProfit,
    revenueBySpecies,
  };
}
