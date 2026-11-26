export type UserRole = 'owner' | 'admin';

export type FishSpecies = 'Lele' | 'Nila' | 'Ikan emas' | 'Patin';

export type PondCondition = 'Optimal' | 'Perlu Perhatian' | 'Pemulihan';

export type WaterQualityStatus = 'Jernih & Sehat' | 'Perlu Sirkulasi' | 'Keruh / Perlu Ganti Air';

export type SizeCategory = 'Kecil' | 'Sedang' | 'Siap panen';

export type ScheduleStatus = 'Belum dilakukan' | 'Sedang dilakukan' | 'Selesai' | 'Terlewat';

export type MaintenanceFrequency = 'Harian' | 'Mingguan' | 'Dua mingguan' | '2-3 bulanan';

export type HealthCheckFrequency = 'Harian' | 'Mingguan' | 'Dua mingguan' | 'Penanganan Sakit';

export type ReportPeriod = 'mingguan' | 'bulanan' | 'tahunan' | 'semua';

export type IncomeCategory =
  | 'Penjualan lele'
  | 'Penjualan nila'
  | 'Penjualan ikan emas'
  | 'Penjualan patin'
  | 'Pemasukan lainnya';

export type ExpenseCategory =
  | 'Pembelian pakan'
  | 'Pembelian bibit'
  | 'Biaya operasional'
  | 'Perawatan kolam'
  | 'Perbaikan peralatan'
  | 'Pengeluaran lainnya';

export interface CapitalAllocationItem {
  id: string;
  name: string;
  amount: number;
  category: 'Infrastruktur' | 'Bibit' | 'Pakan' | 'Peralatan' | 'Operasional' | 'Cadangan';
}

export interface Pond {
  id: string;
  name: string;
  species: FishSpecies;
  lengthMeters: number;
  widthMeters: number;
  areaSqm: number;
  stockingDate: string; // YYYY-MM-DD
  initialSeedCount: number;
  currentPopulation: number;
  mortalityCount: number;
  harvestedCount: number;
  sizeDistribution: {
    kecil: number;
    sedang: number;
    siapPanen: number;
  };
  condition: PondCondition;
  waterStatus: WaterQualityStatus;
  waterNote: string;
  estimatedHarvestDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeedBatch {
  id: string;
  pondId: string;
  species: FishSpecies;
  quantity: number;
  purchaseCost: number;
  purchaseDate: string;
  stockingDate: string;
  supplier: string;
  notes: string;
  createdBy: UserRole;
  createdAt: string;
}

export interface FeedInventoryItem {
  id: string;
  name: string;
  feedType: string;
  targetSpecies: FishSpecies | 'Semua';
  stockKg: number;
  minThresholdKg: number;
  unitPricePerKg: number;
  updatedAt: string;
}

export interface FeedTransaction {
  id: string;
  type: 'masuk' | 'keluar';
  feedId: string;
  feedName: string;
  pondId?: string;
  species?: FishSpecies;
  amountKg: number;
  cost: number;
  date: string;
  notes: string;
  createdBy: UserRole;
  createdAt: string;
}

export interface FishHealthRecord {
  id: string;
  pondId: string;
  species: FishSpecies;
  checkDate: string;
  frequency: HealthCheckFrequency;
  appetiteAndMovement: string;
  symptoms: string;
  suspectedCause: string;
  affectedCount: number;
  actionTaken: string;
  monitoringResult: string;
  isSick: boolean;
  resolved: boolean;
  createdBy: UserRole;
  createdAt: string;
}

export interface FishGrowthRecord {
  id: string;
  pondId: string;
  species: FishSpecies;
  measurementDate: string;
  averageWeightGrams: number;
  averageLengthCm: number;
  sizeCategory: SizeCategory;
  sampleCount: number;
  sizeBreakdown: {
    kecil: number;
    sedang: number;
    siapPanen: number;
  };
  notes: string;
  createdBy: UserRole;
  createdAt: string;
}

export interface FishMortalityRecord {
  id: string;
  pondId: string;
  species: FishSpecies;
  date: string;
  deadCount: number;
  suspectedCause: string;
  notes: string;
  createdBy: UserRole;
  createdAt: string;
}

export interface PondMaintenanceRecord {
  id: string;
  pondId: string;
  date: string;
  frequency: MaintenanceFrequency;
  activity: string;
  conditionBefore: string;
  conditionAfter: string;
  officer: string;
  notes: string;
  cost: number;
  createdBy: UserRole;
  createdAt: string;
}

export interface FeedingSchedule {
  id: string;
  pondId: string;
  species: FishSpecies;
  slotLabel: string; // e.g., Pagi, Siang, Sore
  timeWindow: string; // e.g., 07.00–08.00
  feedId: string;
  plannedAmountKg: number;
  actualAmountKg?: number;
  date: string; // YYYY-MM-DD
  status: ScheduleStatus;
  completedAt?: string;
  updatedBy?: UserRole;
}

export interface HarvestRecord {
  id: string;
  pondId: string;
  species: FishSpecies;
  harvestDate: string;
  fishCount: number;
  totalWeightKg: number;
  pricePerKg: number;
  totalRevenue: number;
  notes: string;
  linkedSaleId: string;
  linkedFinanceId: string;
  createdBy: UserRole;
  createdAt: string;
}

export interface SalesTransaction {
  id: string;
  date: string;
  species: FishSpecies;
  weightKg: number;
  pricePerKg: number;
  totalAmount: number;
  buyerName: string;
  notes: string;
  sourceType: 'harvest' | 'direct';
  sourceHarvestId?: string;
  linkedFinanceId: string;
  createdBy: UserRole;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'pemasukan' | 'pengeluaran';
  category: IncomeCategory | ExpenseCategory;
  amount: number;
  description: string;
  species?: FishSpecies;
  pondId?: string;
  sourceType: 'manual' | 'harvest' | 'sale' | 'seed' | 'feed' | 'maintenance';
  sourceId?: string;
  createdBy: UserRole;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type:
    | 'pakan_jadwal'
    | 'kesehatan'
    | 'pertumbuhan'
    | 'perawatan'
    | 'ikan_sakit'
    | 'kematian'
    | 'stok_pakan'
    | 'panen'
    | 'tertunda';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  pondId?: string;
  targetRole: 'all' | 'owner' | 'admin';
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  timestamp: string;
}

export interface SpeciesScheduleTemplate {
  species: FishSpecies;
  slots: Array<{
    slotLabel: string;
    timeWindow: string;
    defaultAmountKg: number;
  }>;
}

export interface SpeciesSizeThreshold {
  species: FishSpecies;
  smallMaxGrams: number;
  mediumMaxGrams: number;
  harvestReadyMinGrams: number;
}

export interface RevenueTarget {
  species: FishSpecies;
  weekly: number;
  monthly: number;
  yearly: number;
}

export interface FarmSettings {
  farmName: string;
  location: string;
  totalInitialCapital: number;
  seedReserveBudget: number;
  capitalAllocations: CapitalAllocationItem[];
  feedingTemplates: SpeciesScheduleTemplate[];
  sizeThresholds: SpeciesSizeThreshold[];
  revenueTargets: RevenueTarget[];
  browserNotificationsEnabled: boolean;
  lastBackupAt?: string;
}

export interface IkanaraState {
  revision: number;
  updatedAt: string;
  ponds: Pond[];
  seedBatches: SeedBatch[];
  feedInventory: FeedInventoryItem[];
  feedTransactions: FeedTransaction[];
  healthRecords: FishHealthRecord[];
  growthRecords: FishGrowthRecord[];
  mortalityRecords: FishMortalityRecord[];
  maintenanceRecords: PondMaintenanceRecord[];
  feedingSchedules: FeedingSchedule[];
  harvestRecords: HarvestRecord[];
  salesTransactions: SalesTransaction[];
  financialTransactions: FinancialTransaction[];
  notifications: AppNotification[];
  activityLogs: ActivityLog[];
  settings: FarmSettings;
}

export type MutationAction =
  | {
      type: 'CREATE_POND';
      payload: {
        name: string;
        species: FishSpecies;
        lengthMeters: number;
        widthMeters: number;
        stockingDate: string;
        initialSeedCount: number;
        waterNote?: string;
        estimatedHarvestDate: string;
      };
    }
  | {
      type: 'UPDATE_POND_STATUS';
      payload: {
        pondId: string;
        condition: PondCondition;
        waterStatus: WaterQualityStatus;
        waterNote: string;
        estimatedHarvestDate: string;
      };
    }
  | {
      type: 'ADD_SEED_BATCH';
      payload: {
        pondId: string;
        species: FishSpecies;
        quantity: number;
        purchaseCost: number;
        purchaseDate: string;
        stockingDate: string;
        supplier: string;
        notes: string;
        recordExpense: boolean;
      };
    }
  | {
      type: 'PURCHASE_FEED';
      payload: {
        feedId?: string;
        name: string;
        feedType: string;
        targetSpecies: FishSpecies | 'Semua';
        amountKg: number;
        totalCost: number;
        minThresholdKg: number;
        date: string;
        notes: string;
        recordExpense: boolean;
      };
    }
  | {
      type: 'USE_FEED';
      payload: {
        feedId: string;
        pondId: string;
        amountKg: number;
        date: string;
        notes: string;
      };
    }
  | {
      type: 'LOG_HEALTH_CHECK';
      payload: {
        pondId: string;
        checkDate: string;
        frequency: HealthCheckFrequency;
        appetiteAndMovement: string;
        symptoms: string;
        suspectedCause: string;
        affectedCount: number;
        actionTaken: string;
        monitoringResult: string;
        isSick: boolean;
      };
    }
  | {
      type: 'RESOLVE_HEALTH_RECORD';
      payload: {
        recordId: string;
        monitoringResult: string;
      };
    }
  | {
      type: 'LOG_GROWTH';
      payload: {
        pondId: string;
        measurementDate: string;
        averageWeightGrams: number;
        averageLengthCm: number;
        sampleCount: number;
        sizeCategory: SizeCategory;
        sizeBreakdown: {
          kecil: number;
          sedang: number;
          siapPanen: number;
        };
        notes: string;
      };
    }
  | {
      type: 'LOG_MORTALITY';
      payload: {
        pondId: string;
        date: string;
        deadCount: number;
        suspectedCause: string;
        notes: string;
      };
    }
  | {
      type: 'LOG_MAINTENANCE';
      payload: {
        pondId: string;
        date: string;
        frequency: MaintenanceFrequency;
        activity: string;
        conditionBefore: string;
        conditionAfter: string;
        officer: string;
        notes: string;
        cost: number;
      };
    }
  | {
      type: 'UPDATE_FEEDING_SCHEDULE';
      payload: {
        scheduleId: string;
        status: ScheduleStatus;
        actualAmountKg?: number;
        deductFeedStock?: boolean;
      };
    }
  | {
      type: 'GENERATE_DAILY_SCHEDULES';
      payload: {
        date: string;
      };
    }
  | {
      type: 'RECORD_HARVEST';
      payload: {
        pondId: string;
        harvestDate: string;
        fishCount: number;
        totalWeightKg: number;
        pricePerKg: number;
        buyerName?: string;
        notes: string;
      };
    }
  | {
      type: 'RECORD_SALE';
      payload: {
        date: string;
        species: FishSpecies;
        weightKg: number;
        pricePerKg: number;
        buyerName: string;
        notes: string;
      };
    }
  | {
      type: 'RECORD_FINANCE';
      payload: {
        date: string;
        type: 'pemasukan' | 'pengeluaran';
        category: IncomeCategory | ExpenseCategory;
        amount: number;
        description: string;
        species?: FishSpecies;
        pondId?: string;
      };
    }
  | {
      type: 'DELETE_RECORD';
      payload: {
        entityType: 'finance' | 'sale' | 'health' | 'growth' | 'maintenance';
        recordId: string;
      };
    }
  | {
      type: 'MARK_NOTIFICATION_READ';
      payload: {
        notificationId?: string;
        markAll?: boolean;
      };
    }
  | {
      type: 'UPDATE_SETTINGS';
      payload: Partial<FarmSettings>;
    };

export interface MutationEnvelope {
  mutationId: string;
  action: MutationAction;
}
