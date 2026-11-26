import fs from 'fs';
import path from 'path';
import { createInitialIkanaraState } from '../src/domain/initialData';
import type { IkanaraState } from '../src/domain/types';

interface PersistedDatabase {
  state: IkanaraState;
  processedMutations: Record<string, { revision: number; timestamp: string }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ikanara-db.json');
const MAX_IDEMPOTENCY_KEYS = 500;

export class IkanaraRepository {
  private cache: PersistedDatabase | null = null;
  private writeLock: Promise<void> = Promise.resolve();

  private ensureDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromDisk(): PersistedDatabase {
    this.ensureDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as PersistedDatabase;
        if (parsed && parsed.state && Array.isArray(parsed.state.ponds)) {
          return {
            state: parsed.state,
            processedMutations: parsed.processedMutations ?? {},
          };
        }
      } catch (err) {
        console.error('[IKANARA] Failed reading DB file, re-initializing safely:', err);
      }
    }

    const initial: PersistedDatabase = {
      state: createInitialIkanaraState(),
      processedMutations: {},
    };
    this.atomicWrite(initial);
    return initial;
  }

  private atomicWrite(payload: PersistedDatabase): void {
    this.ensureDir();
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public getState(): IkanaraState {
    if (!this.cache) {
      this.cache = this.loadFromDisk();
    }
    return structuredClone(this.cache.state);
  }

  public async runTransaction(
    mutationId: string,
    mutator: (currentState: IkanaraState) => IkanaraState
  ): Promise<{ state: IkanaraState; deduplicated: boolean }> {
    let result: { state: IkanaraState; deduplicated: boolean } = {
      state: this.getState(),
      deduplicated: false,
    };

    const next = this.writeLock.then(() => {
      if (!this.cache) {
        this.cache = this.loadFromDisk();
      }

      if (mutationId && this.cache.processedMutations[mutationId]) {
        result = {
          state: structuredClone(this.cache.state),
          deduplicated: true,
        };
        return;
      }

      const workingState = structuredClone(this.cache.state);
      const updatedState = mutator(workingState);

      const processed = { ...this.cache.processedMutations };
      if (mutationId) {
        processed[mutationId] = {
          revision: updatedState.revision,
          timestamp: updatedState.updatedAt,
        };
        const keys = Object.keys(processed);
        if (keys.length > MAX_IDEMPOTENCY_KEYS) {
          const toDelete = keys.slice(0, keys.length - MAX_IDEMPOTENCY_KEYS);
          for (const k of toDelete) {
            delete processed[k];
          }
        }
      }

      const nextDb: PersistedDatabase = {
        state: updatedState,
        processedMutations: processed,
      };
      this.atomicWrite(nextDb);
      this.cache = nextDb;

      result = {
        state: structuredClone(updatedState),
        deduplicated: false,
      };
    });

    this.writeLock = next.catch(() => undefined);
    await next;
    return result;
  }

  public async replaceState(nextState: IkanaraState): Promise<IkanaraState> {
    const res = await this.runTransaction(`restore-${Date.now()}`, () => ({
      ...nextState,
      revision: (nextState.revision || 1) + 1,
      updatedAt: new Date().toISOString(),
    }));
    return res.state;
  }

  public async resetToInitial(): Promise<IkanaraState> {
    const res = await this.runTransaction(`reset-${Date.now()}`, () =>
      createInitialIkanaraState()
    );
    return res.state;
  }
}

export const repository = new IkanaraRepository();
