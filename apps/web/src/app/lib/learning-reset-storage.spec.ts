import { describe, expect, it } from 'vitest';

import { applyLearningResetStorageCleanup } from './learning-reset-storage';

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('applyLearningResetStorageCleanup', () => {
  it('removes only coding workspace drafts and records the applied reset marker', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-assignment-1', '{"code":"old"}');
    storage.setItem('code-draft-workspace-assignment-2', '{"code":"old"}');
    storage.setItem('cp_default_language', 'python');
    storage.setItem('auth-storage', '{"state":{"token":"keep"}}');
    storage.setItem('theme-storage', 'dark');

    const result = applyLearningResetStorageCleanup({
      storage,
      userId: 'user-1',
      learningResetAt: '2026-07-05T03:04:05.000Z',
    });

    expect(result.removedKeys).toEqual([
      'code-draft-workspace-assignment-1',
      'code-draft-workspace-assignment-2',
    ]);
    expect(storage.getItem('code-draft-workspace-assignment-1')).toBeNull();
    expect(storage.getItem('code-draft-workspace-assignment-2')).toBeNull();
    expect(storage.getItem('cp_default_language')).toBe('python');
    expect(storage.getItem('auth-storage')).toBe('{"state":{"token":"keep"}}');
    expect(storage.getItem('theme-storage')).toBe('dark');
    expect(storage.getItem('learning-reset-applied-user-1')).toBe('2026-07-05T03:04:05.000Z');
  });

  it('does not run again for the same reset marker but runs for a newer marker', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-assignment-1', '{"code":"old"}');

    expect(applyLearningResetStorageCleanup({
      storage,
      userId: 'user-1',
      learningResetAt: '2026-07-05T03:04:05.000Z',
    }).removedKeys).toEqual(['code-draft-workspace-assignment-1']);

    storage.setItem('code-draft-workspace-assignment-2', '{"code":"new"}');
    expect(applyLearningResetStorageCleanup({
      storage,
      userId: 'user-1',
      learningResetAt: '2026-07-05T03:04:05.000Z',
    }).removedKeys).toEqual([]);
    expect(storage.getItem('code-draft-workspace-assignment-2')).toBe('{"code":"new"}');

    expect(applyLearningResetStorageCleanup({
      storage,
      userId: 'user-1',
      learningResetAt: '2026-07-06T03:04:05.000Z',
    }).removedKeys).toEqual(['code-draft-workspace-assignment-2']);
  });
});
