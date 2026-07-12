export const CODE_DRAFT_PREFIX = 'code-draft-workspace-';
const APPLIED_RESET_PREFIX = 'learning-reset-applied-';
export const WORKSPACE_DRAFT_TTL_MS = 48 * 60 * 60 * 1000;

export interface LearningResetStorageCleanupInput {
  storage: Storage;
  userId?: string | null;
  learningResetAt?: string | null;
}

export interface LearningResetStorageCleanupResult {
  removedKeys: string[];
}

export interface WorkspaceDraft {
  code: string;
  language: string;
  savedAt?: string;
}

export interface WorkspaceDraftReadInput {
  storage: Storage;
  key: string;
  now?: Date;
}

export interface WorkspaceDraftReadResult {
  draft: WorkspaceDraft | null;
  removed: boolean;
}

export interface WorkspaceDraftWriteInput {
  storage: Storage;
  key: string;
  code: string;
  language: string;
  now?: Date;
}

export function removeWorkspaceDrafts(storage: Storage): string[] {
  const keysToRemove: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(CODE_DRAFT_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    storage.removeItem(key);
  }

  return keysToRemove;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isExpired(savedAt: string, now: Date): boolean {
  const savedTime = Date.parse(savedAt);
  if (!Number.isFinite(savedTime)) return true;
  return now.getTime() - savedTime > WORKSPACE_DRAFT_TTL_MS;
}

export function readWorkspaceDraft({
  storage,
  key,
  now = new Date(),
}: WorkspaceDraftReadInput): WorkspaceDraftReadResult {
  const raw = storage.getItem(key);
  if (!raw) return { draft: null, removed: false };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || typeof parsed.code !== 'string' || typeof parsed.language !== 'string') {
      storage.removeItem(key);
      return { draft: null, removed: true };
    }

    if (parsed.savedAt !== undefined) {
      if (typeof parsed.savedAt !== 'string' || isExpired(parsed.savedAt, now)) {
        storage.removeItem(key);
        return { draft: null, removed: true };
      }

      return {
        draft: {
          code: parsed.code,
          language: parsed.language,
          savedAt: parsed.savedAt,
        },
        removed: false,
      };
    }

    return {
      draft: {
        code: parsed.code,
        language: parsed.language,
        savedAt: undefined,
      },
      removed: false,
    };
  } catch {
    storage.removeItem(key);
    return { draft: null, removed: true };
  }
}

export function writeWorkspaceDraft({
  storage,
  key,
  code,
  language,
  now = new Date(),
}: WorkspaceDraftWriteInput): void {
  storage.setItem(key, JSON.stringify({
    code,
    language,
    savedAt: now.toISOString(),
  }));
}

export function applyLearningResetStorageCleanup({
  storage,
  userId,
  learningResetAt,
}: LearningResetStorageCleanupInput): LearningResetStorageCleanupResult {
  if (!userId || !learningResetAt) {
    return { removedKeys: [] };
  }

  const appliedKey = `${APPLIED_RESET_PREFIX}${userId}`;
  if (storage.getItem(appliedKey) === learningResetAt) {
    return { removedKeys: [] };
  }

  const removedKeys = removeWorkspaceDrafts(storage);
  storage.setItem(appliedKey, learningResetAt);

  return { removedKeys };
}
