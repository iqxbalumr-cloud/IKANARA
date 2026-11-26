import type {
  ActivityLog,
  AppNotification,
  ExpenseCategory,
  FishSpecies,
  IkanaraState,
  IncomeCategory,
  MutationAction,
  Pond,
  UserRole,
} from '../src/domain/types';
import {
  sanitizeString,
  ValidationError,
  validateInteger,
  validateIsoDate,
  validatePositiveNumber,
  validateSpecies,
} from './validation';

function genId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${ts}${rand}`;
}

function incomeCategoryForSpecies(species: FishSpecies): IncomeCategory {
  switch (species) {
    case 'Lele':
      return 'Penjualan lele';
    case 'Nila':
      return 'Penjualan nila';
    case 'Ikan emas':
      return 'Penjualan ikan emas';
    case 'Patin':
      return 'Penjualan patin';
  }
}

function pushLog(
  state: IkanaraState,
  actorRole: UserRole,
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
  timestamp: string
): void {
  const log: ActivityLog = {
    id: genId('LOG'),
    actorRole,
    action,
    entityType,
    entityId,
    summary,
    timestamp,
  };
  state.activityLogs = [log, ...state.activityLogs].slice(0, 200);
}

function pushNotification(
  state: IkanaraState,
  notif: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>,
  timestamp: string
): void {
  const item: AppNotification = {
    id: genId('NTF'),
    ...notif,
    isRead: false,
    createdAt: timestamp,
  };
  state.notifications = [item, ...state.notifications].slice(0, 100);
}

function recalcSizeDistributionOnDelta(pond: Pond, delta: number): void {
  // Adjust population proportionally without negative buckets
  if (delta > 0) {
    pond.sizeDistribution.kecil += delta;
    return;
  }
  let remaining = Math.abs(delta);
  // Deduct from kecil -> sedang -> siapPanen on mortality, or siapPanen -> sedang -> kecil handled specifically on harvest
  const fromKecil = Math.min(pond.sizeDistribution.kecil, remaining);
  pond.sizeDistribution.kecil -= fromKecil;
  remaining -= fromKecil;

  const fromSedang = Math.min(pond.sizeDistribution.sedang, remaining);
  pond.sizeDistribution.sedang -= fromSedang;
  remaining -= fromSedang;

  const fromReady = Math.min(pond.sizeDistribution.siapPanen, remaining);
  pond.sizeDistribution.siapPanen -= fromReady;
}

export function applyMutation(
  state: IkanaraState,
  role: UserRole,
  action: MutationAction
): IkanaraState {
  const nowIso = new Date().toISOString();

  // RBAC: Owner is supervisory (read-only for operational mutations except marking notifications read or adjusting targets/settings)
  const ownerAllowedActions: MutationAction['type'][] = [
    'MARK_NOTIFICATION_READ',
    'UPDATE_SETTINGS',
  ];

  if (role === 'owner' && !ownerAllowedActions.includes(action.type)) {
    throw new ValidationError(
      'Akses ditolak: Peran Owner hanya memiliki hak pengawasan untuk data operasional. Masuk sebagai Admin untuk mencatat transaksi.',
      403
    );
  }

  switch (action.type) {
    case 'CREATE_POND': {
      const name = sanitizeString(action.payload.name, 'Nama kolam', 80);
      const species = validateSpecies(action.payload.species);
      const lengthMeters = validatePositiveNumber(action.payload.lengthMeters, 'Panjang kolam');
      const widthMeters = validatePositiveNumber(action.payload.widthMeters, 'Lebar kolam');
      const stockingDate = validateIsoDate(action.payload.stockingDate, 'Tanggal penebaran');
      const estimatedHarvestDate = validateIsoDate(action.payload.estimatedHarvestDate, 'Estimasi tanggal panen');
      const initialSeedCount = validateInteger(action.payload.initialSeedCount, 'Jumlah bibit awal', true);
      const waterNote = sanitizeString(action.payload.waterNote ?? 'Kualitas air awal baik.', 'Catatan air', 240, false);

      const nextIdx = state.ponds.length + 1;
      const pondId = `KLM-${String(nextIdx).padStart(2, '0')}`;
      const areaSqm = Number((lengthMeters * widthMeters).toFixed(2));

      const pond: Pond = {
        id: pondId,
        name,
        species,
        lengthMeters,
        widthMeters,
        areaSqm,
        stockingDate,
        initialSeedCount,
        currentPopulation: initialSeedCount,
        mortalityCount: 0,
        harvestedCount: 0,
        sizeDistribution: {
          kecil: initialSeedCount,
          sedang: 0,
          siapPanen: 0,
        },
        condition: 'Optimal',
        waterStatus: 'Jernih & Sehat',
        waterNote: waterNote || 'Kualitas air awal baik.',
        estimatedHarvestDate,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      state.ponds.push(pond);
      pushLog(
        state,
        role,
        action.type,
        'pond',
        pond.id,
        `Admin menambahkan kolam baru ${pond.name} (${pond.id}, ${species}, ${pond.areaSqm} m²).`,
        nowIso
      );
      break;
    }

    case 'UPDATE_POND_STATUS': {
      const pond = state.ponds.find((p) => p.id === action.payload.pondId);
      if (!pond) throw new ValidationError('Kolam tidak ditemukan.', 404);

      pond.condition = action.payload.condition;
      pond.waterStatus = action.payload.waterStatus;
      pond.waterNote = sanitizeString(action.payload.waterNote, 'Catatan kualitas air', 300, false);
      pond.estimatedHarvestDate = validateIsoDate(action.payload.estimatedHarvestDate, 'Estimasi tanggal panen');
      pond.updatedAt = nowIso;

      pushLog(
        state,
        role,
        action.type,
        'pond',
        pond.id,
        `Admin memperbarui kondisi ${pond.name} menjadi "${pond.condition}" (${pond.waterStatus}).`,
        nowIso
      );
      break;
    }

    case 'ADD_SEED_BATCH': {
      const pond = state.ponds.find((p) => p.id === action.payload.pondId);
      if (!pond) throw new ValidationError('Kolam tujuan tidak ditemukan.', 404);

      const species = validateSpecies(action.payload.species);
      const quantity = validateInteger(action.payload.quantity, 'Jumlah bibit');
      const purchaseCost = validatePositiveNumber(action.payload.purchaseCost, 'Biaya pembelian bibit', true);
      const purchaseDate = validateIsoDate(action.payload.purchaseDate, 'Tanggal pembelian');
      const stockingDate = validateIsoDate(action.payload.stockingDate, 'Tanggal penebaran');
      const supplier = sanitizeString(action.payload.supplier, 'Pemasok bibit', 120);
      const notes = sanitizeString(action.payload.notes, 'Catatan penebaran', 300, false);

      const batchId = genId('BBT');
      state.seedBatches.unshift({
        id: batchId,
        pondId: pond.id,
        species,
        quantity,
        purchaseCost,
        purchaseDate,
        stockingDate,
        supplier,
        notes,
        createdBy: role,
        createdAt: nowIso,
      });

      pond.initialSeedCount += quantity;
      pond.currentPopulation += quantity;
      pond.sizeDistribution.kecil += quantity;
      pond.updatedAt = nowIso;

      if (action.payload.recordExpense && purchaseCost > 0) {
        state.financialTransactions.unshift({
          id: genId('KEU'),
          date: purchaseDate,
          type: 'pengeluaran',
          category: 'Pembelian bibit',
          amount: purchaseCost,
          description: `Pembelian ${quantity} ekor bibit ${species} untuk ${pond.name} (${supplier})`,
          species,
          pondId: pond.id,
          sourceType: 'seed',
          sourceId: batchId,
          createdBy: role,
          createdAt: nowIso,
        });
      }

      pushLog(
        state,
        role,
        action.type,
        'seedBatch',
        batchId,
        `Admin menebar ${quantity} ekor bibit ${species} ke ${pond.name}.`,
        nowIso
      );
      break;
    }

    case 'PURCHASE_FEED': {
      const name = sanitizeString(action.payload.name, 'Nama pakan', 100);
      const feedType = sanitizeString(action.payload.feedType, 'Jenis pakan', 100);
      const amountKg = validatePositiveNumber(action.payload.amountKg, 'Jumlah pakan (kg)');
      const totalCost = validatePositiveNumber(action.payload.totalCost, 'Total biaya pembelian', true);
      const minThresholdKg = validatePositiveNumber(action.payload.minThresholdKg, 'Batas minimum stok', true);
      const date = validateIsoDate(action.payload.date, 'Tanggal pembelian');
      const notes = sanitizeString(action.payload.notes, 'Catatan', 240, false);
      const unitPricePerKg = amountKg > 0 ? Math.round(totalCost / amountKg) : 0;

      let feed = action.payload.feedId
        ? state.feedInventory.find((f) => f.id === action.payload.feedId)
        : state.feedInventory.find((f) => f.name.toLowerCase() === name.toLowerCase());

      if (feed) {
        feed.stockKg = Number((feed.stockKg + amountKg).toFixed(2));
        feed.minThresholdKg = minThresholdKg;
        if (unitPricePerKg > 0) feed.unitPricePerKg = unitPricePerKg;
        feed.updatedAt = nowIso;
      } else {
        feed = {
          id: genId('PKN'),
          name,
          feedType,
          targetSpecies: action.payload.targetSpecies,
          stockKg: Number(amountKg.toFixed(2)),
          minThresholdKg,
          unitPricePerKg,
          updatedAt: nowIso,
        };
        state.feedInventory.push(feed);
      }

      const ftxId = genId('FTX');
      state.feedTransactions.unshift({
        id: ftxId,
        type: 'masuk',
        feedId: feed.id,
        feedName: feed.name,
        species: feed.targetSpecies === 'Semua' ? undefined : feed.targetSpecies,
        amountKg,
        cost: totalCost,
        date,
        notes,
        createdBy: role,
        createdAt: nowIso,
      });

      if (action.payload.recordExpense && totalCost > 0) {
        state.financialTransactions.unshift({
          id: genId('KEU'),
          date,
          type: 'pengeluaran',
          category: 'Pembelian pakan',
          amount: totalCost,
          description: `Pembelian pakan ${feed.name} (${amountKg} kg)`,
          species: feed.targetSpecies === 'Semua' ? undefined : feed.targetSpecies,
          sourceType: 'feed',
          sourceId: ftxId,
          createdBy: role,
          createdAt: nowIso,
        });
      }

      pushLog(
        state,
        role,
        action.type,
        'feed',
        feed.id,
        `Admin mencatat pembelian pakan ${feed.name} sebanyak ${amountKg} kg.`,
        nowIso
      );
      break;
    }

    case 'USE_FEED': {
      const feed = state.feedInventory.find((f) => f.id === action.payload.feedId);
      if (!feed) throw new ValidationError('Item pakan tidak ditemukan.', 404);
      const pond = state.ponds.find((p) => p.id === action.payload.pondId);
      if (!pond) throw new ValidationError('Kolam tidak ditemukan.', 404);

      const amountKg = validatePositiveNumber(action.payload.amountKg, 'Jumlah pakan digunakan');
      if (feed.stockKg < amountKg) {
        throw new ValidationError(
          `Stok ${feed.name} tidak mencukupi (tersisa ${feed.stockKg} kg).`
        );
      }

      const date = validateIsoDate(action.payload.date, 'Tanggal pemberian pakan');
      const notes = sanitizeString(action.payload.notes, 'Catatan', 240, false);

      feed.stockKg = Number((feed.stockKg - amountKg).toFixed(2));
      feed.updatedAt = nowIso;

      const ftxId = genId('FTX');
      state.feedTransactions.unshift({
        id: ftxId,
        type: 'keluar',
        feedId: feed.id,
        feedName: feed.name,
        pondId: pond.id,
        species: pond.species,
        amountKg,
        cost: Math.round(amountKg * feed.unitPricePerKg),
        date,
        notes: notes || `Pemberian pakan ${pond.name}`,
        createdBy: role,
        createdAt: nowIso,
      });

      if (feed.stockKg <= feed.minThresholdKg) {
        pushNotification(
          state,
          {
            type: 'stok_pakan',
            severity: feed.stockKg <= feed.minThresholdKg * 0.5 ? 'critical' : 'warning',
            title: `Stok ${feed.name} Hampir Habis`,
            message: `Sisa stok saat ini ${feed.stockKg} kg (batas minimum ${feed.minThresholdKg} kg). Segera lakukan pembelian ulang.`,
            targetRole: 'all',
          },
          nowIso
        );
      }

      pushLog(
        state,
        role,
        action.type,
        'feedTransaction',
        ftxId,
        `Admin mencatat penggunaan ${amountKg} kg ${feed.name} untuk ${pond.name} (${pond.species}).`,
        nowIso
      );
      break;
    }

    case 'LOG_HEALTH_CHECK': {
      const pond = state.ponds.find((p) => p.id === action.payload.pondId);
      if (!pond) throw new ValidationError('Kolam tidak ditemukan.', 404);

      const checkDate = validateIsoDate(action.payload.checkDate, 'Tanggal pemeriksaan');
      const appetiteAndMovement = sanitizeString(
        action.payload.appetiteAndMovement,
        'Gerakan dan nafsu makan',
        240
      );
      const symptoms = sanitizeString(action.payload.symptoms, 'Gejala', 240, false) || 'Tidak ada';
      const suspectedCause = sanitizeString(action.payload.suspectedCause, 'Dugaan penyebab', 240, false) || '-';
      const affectedCount = validateInteger(action.payload.affectedCount, 'Jumlah ikan terdampak', true);
      const actionTaken = sanitizeString(action.payload.actionTaken, 'Tindakan penanganan', 300);
      const monitoringResult = sanitizeString(action.payload.monitoringResult, 'Hasil pemantauan', 300);

      const recId = genId('KSH');
      state.healthRecords.unshift({
        id: recId,
        pondId: pond.id,
        species: pond.species,
        checkDate,
        frequency: action.payload.frequency,
        appetiteAndMovement,
        symptoms,
        suspectedCause,
        affectedCount,
        actionTaken,
        monitoringResult,
        isSick: Boolean(action.payload.isSick),
        resolved: !action.payload.isSick,
        createdBy: role,
        createdAt: nowIso,
      });

      if (action.payload.isSick) {
        pond.condition = 'Perlu Perhatian';
        pond.updatedAt = nowIso;
        pushNotification(
          state,
          {
            type: 'ikan_sakit',
            severity: 'critical',
            title: `Peringatan Ikan Sakit di ${pond.name}`,
            message: `${affectedCount} ekor ${pond.species} menunjukkan gejala "${symptoms}". Tindakan: ${actionTaken}.`,
            pondId: pond.id,
            targetRole: 'all',
          },
          nowIso
        );
      }

      pushLog(
        state,
        role,
        action.type,
        'health',
        recId,
        `Admin mencatat pemeriksaan kesehatan ${pond.name} (${action.payload.frequency}): ${action.payload.isSick ? 'Terdeteksi sakit' : 'Sehat'}.`,
        nowIso
      );
      break;
    }

    case 'RESOLVE_HEALTH_RECORD': {
      const record = state.healthRecords.find((r) => r.id === action.payload.recordId);
      if (!record) throw new ValidationError('Catatan kesehatan tidak ditemukan.', 404);

      record.resolved = true;
      record.monitoringResult = sanitizeString(action.payload.monitoringResult, 'Hasil pemantauan', 300);

      const hasOtherActiveSick = state.healthRecords.some(
        (r) => r.pondId === record.pondId && r.isSick && !r.resolved
      );
      if (!hasOtherActiveSick) {
        const pond = state.ponds.find((p) => p.id === record.pondId);
        if (pond && pond.condition === 'Perlu Perhatian') {
          pond.condition = 'Optimal';
          pond.updatedAt = nowIso;
        }
      }

      pushLog(
        state,
        role,
        action.type,
        'health',
        record.id,
        `Admin menandai penanganan kesehatan ${record.id} selesai dipulihkan.`,
        nowIso
      );
      break;
    }

    case 'LOG_GROWTH': {
      const pond = state.ponds.find((p) => p.id === action.payload.pondId);
      if (!pond) throw new ValidationError('Kolam tidak ditemukan.', 404);

      const measurementDate = validateIsoDate(action.payload.measurementDate, 'Tanggal pengukuran');
      const averageWeightGrams = validatePositiveNumber(action.payload.averageWeightGrams, 'Berat rata-rata (gram)');
      const averageLengthCm = validatePositiveNumber(action.payload.averageLengthCm, 'Panjang rata-rata (cm)');
      const sampleCount = validateInteger(action.payload.sampleCount, 'Jumlah sampel');
      const kecil = validateInteger(action.payload.sizeBreakdown.kecil, 'Jumlah ukuran kecil', true);
      const sedang = validateInteger(action.payload.sizeBreakdown.sedang, 'Jumlah ukuran sedang', true);
      const siapPanen = validateInteger(action.payload.sizeBreakdown.siapPanen, 'Jumlah siap panen', true);
      const notes = sanitizeString(action.payload.notes, 'Catatan pertumbuhan', 300, false);

      if (kecil + sedang + siapPanen !== pond.currentPopulation) {
        throw new ValidationError(
          `Total distribusi ukuran (${kecil + sedang + siapPanen}) harus sama dengan populasi kolam saat ini (${pond.currentPopulation} ekor).`
        );
      }

      const growthId = genId('PRT');
      state.growthRecords.unshift({
        id: growthId,
        pondId: pond.id,
        species: pond.species,
        measurementDate,
        averageWeightGrams,
        averageLengthCm,
        sizeCategory: action.payload.sizeCategory,
        sampleCount,
        sizeBreakdown: { kecil, sedang, siapPanen },
        notes,
        createdBy: role,
        createdAt: nowIso,
      });

      pond.sizeDistribution = { kecil, sedang, siapPanen };
      pond.updatedAt = nowIso;

      if (siapPanen > 0) {
        pushNotification(
          state,
          {
            type: 'panen',
            severity: 'info',
            title: `${siapPanen} Ekor ${pond.species} Siap Panen`,
            message: `Pengukuran pertumbuhan ${pond.name} mencatat ${siapPanen} ekor masuk kategori siap panen.`,
            pondId: pond.id,
            targetRole: 'all',
          },
          nowIso
        );
      }

      pushLog(
        state,
        role,
        action.type,
        'growth',
        growthId,
        `Admin mencatat pertumbuhan ${pond.name}: rata-rata ${averageWeightGrams}g / ${averageLengthCm}cm (${action.payload.sizeCategory}).`,
        nowIso
      );
      break;
    }

    case 'LOG_MORTALITY': {
      const pond = state.ponds.find((p) => p.id === action.payload.pondId);
      if (!pond) throw new ValidationError('Kolam tidak ditemukan.', 404);

      const date = validateIsoDate(action.payload.date, 'Tanggal kematian');
      const deadCount = validateInteger(action.payload.deadCount, 'Jumlah ikan mati');
      if (deadCount > pond.currentPopulation) {
        throw new ValidationError(
          `Jumlah kematian (${deadCount}) melebihi populasi aktif kolam (${pond.currentPopulation} ekor).`
        );
      }

      const suspectedCause = sanitizeString(action.payload.suspectedCause, 'Dugaan penyebab', 240);
      const notes = sanitizeString(action.payload.notes, 'Keterangan tambahan', 300, false);

      const mortId = genId('KMT');
      state.mortalityRecords.unshift({
        id: mortId,
        pondId: pond.id,
        species: pond.species,
        date,
        deadCount,
        suspectedCause,
        notes,
        createdBy: role,
        createdAt: nowIso,
      });

      pond.currentPopulation -= deadCount;
      pond.mortalityCount += deadCount;
      recalcSizeDistributionOnDelta(pond, -deadCount);
      pond.updatedAt = nowIso;

      pushNotification(
        state,
        {
          type: 'kematian',
          severity: deadCount >= 5 ? 'critical' : 'warning',
          title: `Catatan Kematian Ikan di ${pond.name}`,
          message: `${deadCount} ekor ${pond.species} mati pada ${date}. Dugaan penyebab: ${suspectedCause}. Populasi tersisa ${pond.currentPopulation} ekor.`,
          pondId: pond.id,
          targetRole: 'owner',
        },
        nowIso
      );

      pushLog(
        state,
        role,
        action.type,
        'mortality',
        mortId,
        `Admin mencatat ${deadCount} ekor ${pond.species} mati di ${pond.name} (${suspectedCause}).`,
        nowIso
      );
      break;
    }

    case 'LOG_MAINTENANCE': {
      const pond = state.ponds.find((p) => p.id === action.payload.pondId);
      if (!pond) throw new ValidationError('Kolam tidak ditemukan.', 404);

      const date = validateIsoDate(action.payload.date, 'Tanggal perawatan');
      const activity = sanitizeString(action.payload.activity, 'Jenis kegiatan', 200);
      const conditionBefore = sanitizeString(action.payload.conditionBefore, 'Kondisi sebelum', 240);
      const conditionAfter = sanitizeString(action.payload.conditionAfter, 'Kondisi setelah', 240);
      const officer = sanitizeString(action.payload.officer, 'Petugas', 100);
      const notes = sanitizeString(action.payload.notes, 'Catatan tambahan', 300, false);
      const cost = validatePositiveNumber(action.payload.cost, 'Biaya perawatan', true);

      const maintId = genId('PRW');
      state.maintenanceRecords.unshift({
        id: maintId,
        pondId: pond.id,
        date,
        frequency: action.payload.frequency,
        activity,
        conditionBefore,
        conditionAfter,
        officer,
        notes,
        cost,
        createdBy: role,
        createdAt: nowIso,
      });

      if (pond.waterStatus !== 'Jernih & Sehat') {
        pond.waterStatus = 'Jernih & Sehat';
      }
      if (pond.condition === 'Perlu Perhatian' && !state.healthRecords.some((h) => h.pondId === pond.id && h.isSick && !h.resolved)) {
        pond.condition = 'Optimal';
      }
      pond.updatedAt = nowIso;

      if (cost > 0) {
        state.financialTransactions.unshift({
          id: genId('KEU'),
          date,
          type: 'pengeluaran',
          category: 'Perawatan kolam',
          amount: cost,
          description: `${activity} di ${pond.name} (Petugas: ${officer})`,
          pondId: pond.id,
          sourceType: 'maintenance',
          sourceId: maintId,
          createdBy: role,
          createdAt: nowIso,
        });
      }

      pushLog(
        state,
        role,
        action.type,
        'maintenance',
        maintId,
        `Admin mencatat perawatan ${action.payload.frequency} pada ${pond.name}: ${activity}.`,
        nowIso
      );
      break;
    }

    case 'UPDATE_FEEDING_SCHEDULE': {
      const schedule = state.feedingSchedules.find((s) => s.id === action.payload.scheduleId);
      if (!schedule) throw new ValidationError('Jadwal pemberian pakan tidak ditemukan.', 404);

      const previousStatus = schedule.status;
      schedule.status = action.payload.status;
      schedule.updatedBy = role;

      if (action.payload.status === 'Selesai') {
        const actualKg =
          action.payload.actualAmountKg !== undefined
            ? validatePositiveNumber(action.payload.actualAmountKg, 'Jumlah pakan aktual')
            : schedule.plannedAmountKg;
        schedule.actualAmountKg = actualKg;
        schedule.completedAt = nowIso;

        // Deduct feed stock only on transition to Selesai so stock isn't double-deducted
        if (action.payload.deductFeedStock !== false && previousStatus !== 'Selesai') {
          const feed = state.feedInventory.find((f) => f.id === schedule.feedId);
          if (feed && feed.stockKg >= actualKg) {
            feed.stockKg = Number((feed.stockKg - actualKg).toFixed(2));
            feed.updatedAt = nowIso;
            state.feedTransactions.unshift({
              id: genId('FTX'),
              type: 'keluar',
              feedId: feed.id,
              feedName: feed.name,
              pondId: schedule.pondId,
              species: schedule.species,
              amountKg: actualKg,
              cost: Math.round(actualKg * feed.unitPricePerKg),
              date: schedule.date,
              notes: `Pemberian pakan terjadwal (${schedule.slotLabel} ${schedule.timeWindow})`,
              createdBy: role,
              createdAt: nowIso,
            });

            if (feed.stockKg <= feed.minThresholdKg) {
              pushNotification(
                state,
                {
                  type: 'stok_pakan',
                  severity: 'warning',
                  title: `Stok ${feed.name} Menipis`,
                  message: `Tersisa ${feed.stockKg} kg (batas minimum ${feed.minThresholdKg} kg).`,
                  targetRole: 'all',
                },
                nowIso
              );
            }
          }
        }
      }

      if (action.payload.status === 'Terlewat' && previousStatus !== 'Terlewat') {
        pushNotification(
          state,
          {
            type: 'tertunda',
            severity: 'warning',
            title: `Jadwal Pakan Terlewat (${schedule.pondId})`,
            message: `Pemberian pakan ${schedule.species} sesi ${schedule.slotLabel} (${schedule.timeWindow}) ditandai terlewat.`,
            pondId: schedule.pondId,
            targetRole: 'all',
          },
          nowIso
        );
      }

      pushLog(
        state,
        role,
        action.type,
        'feedingSchedule',
        schedule.id,
        `Admin mengubah status jadwal pakan ${schedule.pondId} (${schedule.slotLabel}) menjadi "${schedule.status}".`,
        nowIso
      );
      break;
    }

    case 'GENERATE_DAILY_SCHEDULES': {
      const date = validateIsoDate(action.payload.date, 'Tanggal jadwal');
      let addedCount = 0;

      for (const pond of state.ponds.filter((p) => p.isActive)) {
        const template = state.settings.feedingTemplates.find((t) => t.species === pond.species);
        const feed =
          state.feedInventory.find((f) => f.targetSpecies === pond.species) ??
          state.feedInventory[0];
        if (!template || !feed) continue;

        for (const slot of template.slots) {
          const exists = state.feedingSchedules.some(
            (s) => s.pondId === pond.id && s.date === date && s.slotLabel === slot.slotLabel
          );
          if (!exists) {
            state.feedingSchedules.push({
              id: genId('JDW'),
              pondId: pond.id,
              species: pond.species,
              slotLabel: slot.slotLabel,
              timeWindow: slot.timeWindow,
              feedId: feed.id,
              plannedAmountKg: slot.defaultAmountKg,
              date,
              status: 'Belum dilakukan',
            });
            addedCount++;
          }
        }
      }

      pushLog(
        state,
        role,
        action.type,
        'feedingSchedule',
        date,
        `Admin membuat ${addedCount} jadwal pakan harian untuk tanggal ${date}.`,
        nowIso
      );
      break;
    }

    case 'RECORD_HARVEST': {
      const pond = state.ponds.find((p) => p.id === action.payload.pondId);
      if (!pond) throw new ValidationError('Kolam asal panen tidak ditemukan.', 404);

      const harvestDate = validateIsoDate(action.payload.harvestDate, 'Tanggal panen');
      const fishCount = validateInteger(action.payload.fishCount, 'Jumlah ikan dipanen');
      if (fishCount > pond.currentPopulation) {
        throw new ValidationError(
          `Jumlah panen (${fishCount}) melebihi populasi aktif kolam (${pond.currentPopulation} ekor).`
        );
      }

      const totalWeightKg = validatePositiveNumber(action.payload.totalWeightKg, 'Berat total panen (kg)');
      const pricePerKg = validatePositiveNumber(action.payload.pricePerKg, 'Harga jual per kg');
      const buyerName = sanitizeString(action.payload.buyerName ?? 'Pembeli Panen Langsung', 'Nama pembeli', 120, false) || 'Pembeli Panen Langsung';
      const notes = sanitizeString(action.payload.notes, 'Keterangan panen', 300, false);

      const totalRevenue = Math.round(totalWeightKg * pricePerKg);
      const harvestId = genId('PAN');
      const saleId = genId('PNJ');
      const financeId = genId('KEU');

      // Deduct population & update harvest-ready bucket first
      pond.currentPopulation -= fishCount;
      pond.harvestedCount += fishCount;
      let rem = fishCount;
      const fromReady = Math.min(pond.sizeDistribution.siapPanen, rem);
      pond.sizeDistribution.siapPanen -= fromReady;
      rem -= fromReady;
      const fromSedang = Math.min(pond.sizeDistribution.sedang, rem);
      pond.sizeDistribution.sedang -= fromSedang;
      rem -= fromSedang;
      const fromKecil = Math.min(pond.sizeDistribution.kecil, rem);
      pond.sizeDistribution.kecil -= fromKecil;
      pond.updatedAt = nowIso;

      // Record Harvest
      state.harvestRecords.unshift({
        id: harvestId,
        pondId: pond.id,
        species: pond.species,
        harvestDate,
        fishCount,
        totalWeightKg,
        pricePerKg,
        totalRevenue,
        notes,
        linkedSaleId: saleId,
        linkedFinanceId: financeId,
        createdBy: role,
        createdAt: nowIso,
      });

      // Automatically link SalesTransaction (anti double-counting: sourceType = 'harvest')
      state.salesTransactions.unshift({
        id: saleId,
        date: harvestDate,
        species: pond.species,
        weightKg: totalWeightKg,
        pricePerKg,
        totalAmount: totalRevenue,
        buyerName,
        notes: notes || `Hasil panen ${pond.name} (${fishCount} ekor)`,
        sourceType: 'harvest',
        sourceHarvestId: harvestId,
        linkedFinanceId: financeId,
        createdBy: role,
        createdAt: nowIso,
      });

      // Automatically link single FinancialTransaction
      state.financialTransactions.unshift({
        id: financeId,
        date: harvestDate,
        type: 'pemasukan',
        category: incomeCategoryForSpecies(pond.species),
        amount: totalRevenue,
        description: `Panen & Penjualan ${pond.species} ${totalWeightKg} kg (${fishCount} ekor) dari ${pond.name}`,
        species: pond.species,
        pondId: pond.id,
        sourceType: 'harvest',
        sourceId: harvestId,
        createdBy: role,
        createdAt: nowIso,
      });

      pushNotification(
        state,
        {
          type: 'panen',
          severity: 'info',
          title: `Panen ${pond.name} Tercatat`,
          message: `${fishCount} ekor ${pond.species} (${totalWeightKg} kg) terjual senilai Rp${totalRevenue.toLocaleString('id-ID')}.`,
          pondId: pond.id,
          targetRole: 'owner',
        },
        nowIso
      );

      pushLog(
        state,
        role,
        action.type,
        'harvest',
        harvestId,
        `Admin mencatat panen ${pond.name}: ${fishCount} ekor (${totalWeightKg} kg) senilai Rp${totalRevenue.toLocaleString('id-ID')}.`,
        nowIso
      );
      break;
    }

    case 'RECORD_SALE': {
      const date = validateIsoDate(action.payload.date, 'Tanggal transaksi');
      const species = validateSpecies(action.payload.species);
      const weightKg = validatePositiveNumber(action.payload.weightKg, 'Jumlah kilogram');
      const pricePerKg = validatePositiveNumber(action.payload.pricePerKg, 'Harga per kilogram');
      const buyerName = sanitizeString(action.payload.buyerName, 'Nama pembeli / keterangan', 120);
      const notes = sanitizeString(action.payload.notes, 'Keterangan transaksi', 300, false);

      const totalAmount = Math.round(weightKg * pricePerKg);
      const saleId = genId('PNJ');
      const financeId = genId('KEU');

      state.salesTransactions.unshift({
        id: saleId,
        date,
        species,
        weightKg,
        pricePerKg,
        totalAmount,
        buyerName,
        notes,
        sourceType: 'direct',
        linkedFinanceId: financeId,
        createdBy: role,
        createdAt: nowIso,
      });

      state.financialTransactions.unshift({
        id: financeId,
        date,
        type: 'pemasukan',
        category: incomeCategoryForSpecies(species),
        amount: totalAmount,
        description: `Penjualan ${species} ${weightKg} kg @ Rp${pricePerKg.toLocaleString('id-ID')} (${buyerName})`,
        species,
        sourceType: 'sale',
        sourceId: saleId,
        createdBy: role,
        createdAt: nowIso,
      });

      pushLog(
        state,
        role,
        action.type,
        'sale',
        saleId,
        `Admin mencatat penjualan ${species} ${weightKg} kg senilai Rp${totalAmount.toLocaleString('id-ID')}.`,
        nowIso
      );
      break;
    }

    case 'RECORD_FINANCE': {
      const date = validateIsoDate(action.payload.date, 'Tanggal transaksi');
      const amount = validatePositiveNumber(action.payload.amount, 'Nominal transaksi');
      const description = sanitizeString(action.payload.description, 'Keterangan', 280);
      const type = action.payload.type;
      if (type !== 'pemasukan' && type !== 'pengeluaran') {
        throw new ValidationError('Tipe transaksi keuangan tidak valid.');
      }

      const validIncome: IncomeCategory[] = [
        'Penjualan lele',
        'Penjualan nila',
        'Penjualan ikan emas',
        'Penjualan patin',
        'Pemasukan lainnya',
      ];
      const validExpense: ExpenseCategory[] = [
        'Pembelian pakan',
        'Pembelian bibit',
        'Biaya operasional',
        'Perawatan kolam',
        'Perbaikan peralatan',
        'Pengeluaran lainnya',
      ];
      if (type === 'pemasukan' && !validIncome.includes(action.payload.category as IncomeCategory)) {
        throw new ValidationError('Kategori pemasukan tidak valid.');
      }
      if (type === 'pengeluaran' && !validExpense.includes(action.payload.category as ExpenseCategory)) {
        throw new ValidationError('Kategori pengeluaran tidak valid.');
      }

      const finId = genId('KEU');
      state.financialTransactions.unshift({
        id: finId,
        date,
        type,
        category: action.payload.category,
        amount: Math.round(amount),
        description,
        species: action.payload.species,
        pondId: action.payload.pondId,
        sourceType: 'manual',
        createdBy: role,
        createdAt: nowIso,
      });

      pushLog(
        state,
        role,
        action.type,
        'finance',
        finId,
        `Admin mencatat ${type} (${action.payload.category}) sebesar Rp${Math.round(amount).toLocaleString('id-ID')}.`,
        nowIso
      );
      break;
    }

    case 'DELETE_RECORD': {
      const { entityType, recordId } = action.payload;
      if (entityType === 'finance') {
        const tx = state.financialTransactions.find((t) => t.id === recordId);
        if (!tx) throw new ValidationError('Transaksi keuangan tidak ditemukan.', 404);
        if (tx.sourceType === 'harvest' || tx.sourceType === 'sale') {
          throw new ValidationError(
            'Transaksi keuangan yang terhubung dengan Panen/Penjualan harus dihapus dari menu Penjualan agar pembukuan tetap sinkron.'
          );
        }
        state.financialTransactions = state.financialTransactions.filter((t) => t.id !== recordId);
      } else if (entityType === 'sale') {
        const sale = state.salesTransactions.find((s) => s.id === recordId);
        if (!sale) throw new ValidationError('Transaksi penjualan tidak ditemukan.', 404);
        if (sale.sourceType === 'harvest') {
          throw new ValidationError(
            'Penjualan dari hasil panen otomatis terhubung ke catatan Panen dan tidak dapat dihapus terpisah.'
          );
        }
        state.salesTransactions = state.salesTransactions.filter((s) => s.id !== recordId);
        state.financialTransactions = state.financialTransactions.filter(
          (f) => f.id !== sale.linkedFinanceId
        );
      } else if (entityType === 'health') {
        state.healthRecords = state.healthRecords.filter((h) => h.id !== recordId);
      } else if (entityType === 'growth') {
        state.growthRecords = state.growthRecords.filter((g) => g.id !== recordId);
      } else if (entityType === 'maintenance') {
        state.maintenanceRecords = state.maintenanceRecords.filter((m) => m.id !== recordId);
      }

      pushLog(
        state,
        role,
        action.type,
        entityType,
        recordId,
        `Admin menghapus data ${entityType} (${recordId}).`,
        nowIso
      );
      break;
    }

    case 'MARK_NOTIFICATION_READ': {
      if (action.payload.markAll) {
        state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      } else if (action.payload.notificationId) {
        state.notifications = state.notifications.map((n) =>
          n.id === action.payload.notificationId ? { ...n, isRead: true } : n
        );
      }
      break;
    }

    case 'UPDATE_SETTINGS': {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
      pushLog(
        state,
        role,
        action.type,
        'settings',
        'FARM-SETTINGS',
        `${role === 'owner' ? 'Owner' : 'Admin'} memperbarui konfigurasi sistem IKANARA.`,
        nowIso
      );
      break;
    }
  }

  state.revision += 1;
  state.updatedAt = nowIso;
  return state;
}
