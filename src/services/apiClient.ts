import { createInitialIkanaraState } from '../domain/initialData';
import type { IkanaraState, MutationAction, MutationEnvelope, UserRole } from '../domain/types';

const SNAPSHOT_STORAGE_KEY = 'ikanara_cached_state_v1';
const QUEUE_STORAGE_KEY = 'ikanara_offline_queue_v1';

interface QueuedMutation {
  role: UserRole;
  envelope: MutationEnvelope;
}

export function loadCachedState(): IkanaraState {
  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as IkanaraState;
      if (parsed && Array.isArray(parsed.ponds) && parsed.settings) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage read error
  }
  return createInitialIkanaraState();
}

export function saveCachedState(state: IkanaraState): void {
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

export function getOfflineQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QueuedMutation[];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // Ignore
  }
  return [];
}

function saveOfflineQueue(queue: QueuedMutation[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore
  }
}

export function enqueueOfflineMutation(role: UserRole, envelope: MutationEnvelope): number {
  const queue = getOfflineQueue();
  if (!queue.some((item) => item.envelope.mutationId === envelope.mutationId)) {
    queue.push({ role, envelope });
    saveOfflineQueue(queue);
  }
  return queue.length;
}

export async function fetchServerState(): Promise<IkanaraState> {
  const res = await fetch('/api/state', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error('Gagal memuat data dari server.');
  }
  const state = (await res.json()) as IkanaraState;
  saveCachedState(state);
  return state;
}

export async function sendMutationToServer(
  role: UserRole,
  envelope: MutationEnvelope
): Promise<{ state: IkanaraState; deduplicated: boolean }> {
  const res = await fetch('/api/mutate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ikanara-Role': role,
    },
    body: JSON.stringify(envelope),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Gagal menyimpan perubahan ke server.');
  }
  saveCachedState(data.state);
  return data;
}

export async function flushOfflineQueue(): Promise<{
  syncedCount: number;
  latestState: IkanaraState | null;
  remaining: number;
}> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, latestState: null, remaining: 0 };
  }

  let syncedCount = 0;
  let latestState: IkanaraState | null = null;
  const remainingQueue: QueuedMutation[] = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      const res = await sendMutationToServer(item.role, item.envelope);
      latestState = res.state;
      syncedCount++;
    } catch (err) {
      // Network error: keep current and subsequent mutations in queue in exact order
      const isNetworkError =
        err instanceof TypeError ||
        (err instanceof Error && err.message.toLowerCase().includes('fetch'));
      if (isNetworkError) {
        remainingQueue.push(...queue.slice(i));
        break;
      }
      // Validation error on queued item: drop invalid item to avoid blocking subsequent valid items
    }
  }

  saveOfflineQueue(remainingQueue);
  return {
    syncedCount,
    latestState,
    remaining: remainingQueue.length,
  };
}

export function createMutationEnvelope(action: MutationAction): MutationEnvelope {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    mutationId: `mut-${randomPart}`,
    action,
  };
}

export async function restoreBackupToServer(
  role: UserRole,
  statePayload: IkanaraState
): Promise<IkanaraState> {
  const res = await fetch('/api/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ikanara-Role': role,
    },
    body: JSON.stringify(statePayload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Gagal memulihkan data cadangan.');
  }
  saveCachedState(data.state);
  return data.state;
}

export async function resetDataOnServer(role: UserRole): Promise<IkanaraState> {
  const res = await fetch('/api/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ikanara-Role': role,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Gagal mereset data awal.');
  }
  saveCachedState(data.state);
  return data.state;
}
