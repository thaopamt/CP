const CODE_DRAFT_PREFIX = 'code-draft-workspace-';
const APPLIED_RESET_PREFIX = 'learning-reset-applied-';

export interface LearningResetStorageCleanupInput {
  storage: Storage;
  userId?: string | null;
  learningResetAt?: string | null;
}

export interface LearningResetStorageCleanupResult {
  removedKeys: string[];
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
  storage.setItem(appliedKey, learningResetAt);

  return { removedKeys: keysToRemove };
}
