import { describe, expect, it } from 'vitest';

import {
  applyLearningResetStorageCleanup,
  readWorkspaceDraft,
  removeWorkspaceDrafts,
  WORKSPACE_DRAFT_TTL_MS,
  writeWorkspaceDraft,
} from './learning-reset-storage';

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

describe('workspace draft helpers', () => {
  it('removes all workspace drafts and keeps unrelated localStorage keys', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', '{"code":"old"}');
    storage.setItem('code-draft-workspace-b', '{"code":"old"}');
    storage.setItem('cp_default_language', 'cpp');

    expect(removeWorkspaceDrafts(storage)).toEqual([
      'code-draft-workspace-a',
      'code-draft-workspace-b',
    ]);
    expect(storage.getItem('code-draft-workspace-a')).toBeNull();
    expect(storage.getItem('code-draft-workspace-b')).toBeNull();
    expect(storage.getItem('cp_default_language')).toBe('cpp');
  });

  it('reads valid drafts younger than 48 hours', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', JSON.stringify({
      code: 'print(1)',
      language: 'python',
      savedAt: '2026-07-12T00:00:00.000Z',
    }));

    expect(readWorkspaceDraft({
      storage,
      key: 'code-draft-workspace-a',
      now: new Date('2026-07-13T23:59:59.000Z'),
    })).toEqual({
      draft: {
        code: 'print(1)',
        language: 'python',
        savedAt: '2026-07-12T00:00:00.000Z',
      },
      removed: false,
    });
  });

  it('removes drafts older than 48 hours', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', JSON.stringify({
      code: 'print(1)',
      language: 'python',
      savedAt: '2026-07-12T00:00:00.000Z',
    }));

    expect(readWorkspaceDraft({
      storage,
      key: 'code-draft-workspace-a',
      now: new Date('2026-07-14T00:00:01.000Z'),
    })).toEqual({ draft: null, removed: true });
    expect(storage.getItem('code-draft-workspace-a')).toBeNull();
    expect(WORKSPACE_DRAFT_TTL_MS).toBe(48 * 60 * 60 * 1000);
  });

  it('allows legacy drafts without savedAt to be read once', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', '{"code":"old","language":"cpp"}');

    expect(readWorkspaceDraft({
      storage,
      key: 'code-draft-workspace-a',
      now: new Date('2026-07-14T00:00:01.000Z'),
    })).toEqual({
      draft: { code: 'old', language: 'cpp', savedAt: undefined },
      removed: false,
    });
  });

  it('removes invalid JSON drafts', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', '{bad json');

    expect(readWorkspaceDraft({
      storage,
      key: 'code-draft-workspace-a',
      now: new Date('2026-07-12T00:00:00.000Z'),
    })).toEqual({ draft: null, removed: true });
    expect(storage.getItem('code-draft-workspace-a')).toBeNull();
  });

  it('writes drafts with savedAt', () => {
    const storage = new MemoryStorage();

    writeWorkspaceDraft({
      storage,
      key: 'code-draft-workspace-a',
      code: 'cout << 1;',
      language: 'cpp',
      now: new Date('2026-07-12T08:00:00.000Z'),
    });

    expect(storage.getItem('code-draft-workspace-a')).toBe(JSON.stringify({
      code: 'cout << 1;',
      language: 'cpp',
      savedAt: '2026-07-12T08:00:00.000Z',
    }));
  });

  it('removeWorkspaceDrafts is safe to call before auth clear on blocked responses', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', '{"code":"old"}');
    storage.setItem('code-draft-workspace-b', '{"code":"old"}');
    storage.setItem('cp_default_language', 'python');

    const removed = removeWorkspaceDrafts(storage);

    expect(removed).toEqual(['code-draft-workspace-a', 'code-draft-workspace-b']);
    expect(storage.getItem('cp_default_language')).toBe('python');
  });
});
