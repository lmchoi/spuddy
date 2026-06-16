import { exportDatabase } from '@/src/domain/export';

const mockRun = jest.fn();
const mockDeleteAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///data/data/host.exp.exponent/cache/ExponentExperienceData/%40anonymous%2Fspuddy-abc%2F/',
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
}));

// Decoded cache path that SQLite receives (filesystem path, not URI)
const CACHE_PATH = '/data/data/host.exp.exponent/cache/ExponentExperienceData/@anonymous/spuddy-abc/';

const mockDB = {
  run: mockRun,
} as unknown as import('../src/storage').DrizzleDB;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('exportDatabase', () => {
  it('uses VACUUM INTO to write backup to the cache directory', async () => {
    await exportDatabase(mockDB);
    const call = mockRun.mock.calls[0][0] as string;
    expect(call).toMatch(/^VACUUM INTO '/);
    expect(call).toContain(CACHE_PATH);
    expect(call).toContain('spuddy-backup-');
    expect(call).toMatch(/\.db'$/);
  });

  it('deletes any existing backup for the same date before writing', async () => {
    await exportDatabase(mockDB);
    expect(mockDeleteAsync).toHaveBeenCalledWith(
      expect.stringContaining('spuddy-backup-'),
      { idempotent: true },
    );
  });

  it('returns the cache URI of the backup file', async () => {
    const result = await exportDatabase(mockDB);
    expect(result).toContain('spuddy-backup-');
    expect(result).toMatch(/\.db$/);
    expect(result).toMatch(/^file:\/\//);
  });

  it('destination URI includes the current date', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = await exportDatabase(mockDB);
    expect(result).toContain(today);
  });
});
