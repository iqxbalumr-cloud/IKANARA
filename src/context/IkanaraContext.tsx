import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { IkanaraState, MutationAction, UserRole } from '../domain/types';
import {
  createMutationEnvelope,
  enqueueOfflineMutation,
  fetchServerState,
  flushOfflineQueue,
  getOfflineQueue,
  loadCachedState,
  resetDataOnServer,
  restoreBackupToServer,
  saveCachedState,
  sendMutationToServer,
} from '../services/apiClient';
import { triggerBrowserNotification } from '../services/notifications';

export type NavSectionId =
  | 'dashboard'
  | 'kolam'
  | 'bibit'
  | 'pakan'
  | 'kesehatan'
  | 'pertumbuhan'
  | 'perawatan'
  | 'jadwal'
  | 'panen'
  | 'penjualan'
  | 'keuangan'
  | 'laporan'
  | 'pengaturan';

export type SyncStatus = 'online' | 'syncing' | 'offline';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface IkanaraContextValue {
  role: UserRole | null;
  state: IkanaraState;
  loading: boolean;
  syncStatus: SyncStatus;
  pendingQueueCount: number;
  activeNav: NavSectionId;
  selectedPondId: string | null;
  toasts: ToastMessage[];
  enterAsRole: (role: UserRole) => void;
  logoutRole: () => void;
  navigateTo: (section: NavSectionId, pondId?: string | null) => void;
  mutate: (action: MutationAction, successMessage?: string) => Promise<boolean>;
  refreshState: () => Promise<void>;
  restoreBackup: (backupState: IkanaraState) => Promise<boolean>;
  resetToDefault: () => Promise<boolean>;
  dismissToast: (id: string) => void;
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const IkanaraContext = createContext<IkanaraContextValue | null>(null);

const ROLE_STORAGE_KEY = 'ikanara_active_role_v1';

export function IkanaraProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(() => {
    try {
      const saved = sessionStorage.getItem(ROLE_STORAGE_KEY);
      if (saved === 'owner' || saved === 'admin') return saved;
    } catch {
      // Ignore
    }
    return null;
  });

  const [state, setState] = useState<IkanaraState>(() => loadCachedState());
  const [loading, setLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online'
  );
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() => getOfflineQueue().length);
  const [activeNav, setActiveNav] = useState<NavSectionId>('dashboard');
  const [selectedPondId, setSelectedPondId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const knownNotifIdsRef = useRef<Set<string>>(new Set());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const checkNewNotifications = useCallback((nextState: IkanaraState) => {
    const known = knownNotifIdsRef.current;
    if (known.size === 0) {
      nextState.notifications.forEach((n) => known.add(n.id));
      return;
    }
    for (const notif of nextState.notifications) {
      if (!known.has(notif.id)) {
        known.add(notif.id);
        if (!notif.isRead && nextState.settings.browserNotificationsEnabled) {
          triggerBrowserNotification(notif.title, notif.message);
        }
      }
    }
  }, []);

  const refreshState = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      setLoading(false);
      return;
    }

    setSyncStatus('syncing');
    try {
      const flushed = await flushOfflineQueue();
      setPendingQueueCount(flushed.remaining);

      if (flushed.syncedCount > 0) {
        pushToast({
          type: 'info',
          title: 'Sinkronisasi Offline Selesai',
          description: `${flushed.syncedCount} perubahan tertunda berhasil disinkronkan ke server.`,
        });
      }

      const fresh = flushed.latestState ?? (await fetchServerState());
      setState(fresh);
      checkNewNotifications(fresh);
      setSyncStatus('online');
    } catch {
      setSyncStatus('offline');
    } finally {
      setLoading(false);
    }
  }, [checkNewNotifications, pushToast]);

  useEffect(() => {
    refreshState();

    const handleOnline = () => {
      refreshState();
    };
    const handleOffline = () => {
      setSyncStatus('offline');
      pushToast({
        type: 'info',
        title: 'Koneksi Terputus',
        description: 'Aplikasi beralih ke mode luring. Perubahan baru akan disimpan aman dan disinkronkan otomatis.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Light polling every 25s for multi-device Web/iOS sync
    const interval = window.setInterval(() => {
      if (navigator.onLine) {
        fetchServerState()
          .then((fresh) => {
            setState((prev) => {
              if (fresh.revision !== prev.revision) {
                checkNewNotifications(fresh);
                return fresh;
              }
              return prev;
            });
            setSyncStatus('online');
          })
          .catch(() => {
            setSyncStatus('offline');
          });
      }
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearInterval(interval);
    };
  }, [checkNewNotifications, pushToast, refreshState]);

  const enterAsRole = useCallback((chosenRole: UserRole) => {
    setRole(chosenRole);
    setActiveNav('dashboard');
    setSelectedPondId(null);
    try {
      sessionStorage.setItem(ROLE_STORAGE_KEY, chosenRole);
    } catch {
      // Ignore
    }
  }, []);

  const logoutRole = useCallback(() => {
    setRole(null);
    setSelectedPondId(null);
    try {
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const navigateTo = useCallback((section: NavSectionId, pondId: string | null = null) => {
    setActiveNav(section);
    setSelectedPondId(pondId);
  }, []);

  const mutate = useCallback(
    async (action: MutationAction, successMessage?: string): Promise<boolean> => {
      if (!role) return false;

      const envelope = createMutationEnvelope(action);

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const count = enqueueOfflineMutation(role, envelope);
        setPendingQueueCount(count);
        setSyncStatus('offline');
        pushToast({
          type: 'info',
          title: 'Disimpan ke Antrean Luring',
          description: 'Koneksi internet terputus. Perubahan akan dikirim otomatis saat tersambung kembali.',
        });
        return true;
      }

      setSyncStatus('syncing');
      try {
        const res = await sendMutationToServer(role, envelope);
        setState(res.state);
        checkNewNotifications(res.state);
        setSyncStatus('online');
        if (successMessage) {
          pushToast({
            type: 'success',
            title: successMessage,
          });
        }
        return true;
      } catch (err) {
        const isNetworkError =
          err instanceof TypeError ||
          (err instanceof Error && err.message.toLowerCase().includes('failed to fetch'));

        if (isNetworkError) {
          const count = enqueueOfflineMutation(role, envelope);
          setPendingQueueCount(count);
          setSyncStatus('offline');
          pushToast({
            type: 'info',
            title: 'Disimpan ke Antrean Luring',
            description: 'Server tidak terjangkau sementara. Data aman dan siap disinkronkan.',
          });
          return true;
        }

        setSyncStatus('online');
        pushToast({
          type: 'error',
          title: 'Gagal Menyimpan Data',
          description: err instanceof Error ? err.message : 'Terjadi kesalahan validasi.',
        });
        return false;
      }
    },
    [checkNewNotifications, pushToast, role]
  );

  const restoreBackup = useCallback(
    async (backupState: IkanaraState): Promise<boolean> => {
      if (!role) return false;
      try {
        const next = await restoreBackupToServer(role, backupState);
        setState(next);
        saveCachedState(next);
        pushToast({
          type: 'success',
          title: 'Pemulihan Data Berhasil',
          description: 'Basis data IKANARA telah dipulihkan dari file cadangan.',
        });
        return true;
      } catch (err) {
        pushToast({
          type: 'error',
          title: 'Pemulihan Gagal',
          description: err instanceof Error ? err.message : 'Format cadangan tidak valid.',
        });
        return false;
      }
    },
    [pushToast, role]
  );

  const resetToDefault = useCallback(async (): Promise<boolean> => {
    if (!role) return false;
    try {
      const next = await resetDataOnServer(role);
      setState(next);
      saveCachedState(next);
      pushToast({
        type: 'success',
        title: 'Data Awal Dipulihkan',
        description: 'Seluruh data dikembalikan ke konfigurasi awal usaha IKANARA.',
      });
      return true;
    } catch (err) {
      pushToast({
        type: 'error',
        title: 'Gagal Reset Data',
        description: err instanceof Error ? err.message : 'Operasi ditolak.',
      });
      return false;
    }
  }, [pushToast, role]);

  return (
    <IkanaraContext.Provider
      value={{
        role,
        state,
        loading,
        syncStatus,
        pendingQueueCount,
        activeNav,
        selectedPondId,
        toasts,
        enterAsRole,
        logoutRole,
        navigateTo,
        mutate,
        refreshState,
        restoreBackup,
        resetToDefault,
        dismissToast,
        pushToast,
      }}
    >
      {children}
    </IkanaraContext.Provider>
  );
}

export function useIkanara(): IkanaraContextValue {
  const ctx = useContext(IkanaraContext);
  if (!ctx) throw new Error('useIkanara must be used within IkanaraProvider');
  return ctx;
}
