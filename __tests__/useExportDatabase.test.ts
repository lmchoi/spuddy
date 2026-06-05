const mockExportDatabase = jest.fn();
const mockShareAsync = jest.fn();

jest.mock('@/src/domain/export', () => ({
  exportDatabase: (...args: unknown[]) => mockExportDatabase(...args),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

jest.mock('@/src/db', () => ({
  getDB: jest.fn().mockResolvedValue({}),
}));

import { renderHook, act } from '@testing-library/react-native';
import { useExportDatabase } from '@/src/hooks/useExportDatabase';

beforeEach(() => {
  jest.clearAllMocks();
  mockExportDatabase.mockResolvedValue('file:///cache/spuddy-backup-2026-06-05.db');
  mockShareAsync.mockResolvedValue(undefined);
});

describe('useExportDatabase', () => {
  it('starts with exporting=false and no error', () => {
    const { result } = renderHook(() => useExportDatabase());
    expect(result.current.exporting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets exporting=true while the export is in progress', async () => {
    let resolveExport!: () => void;
    mockExportDatabase.mockReturnValue(new Promise<string>(resolve => {
      resolveExport = () => resolve('file:///cache/spuddy-backup.db');
    }));

    const { result } = renderHook(() => useExportDatabase());
    act(() => { result.current.exportData(); });
    expect(result.current.exporting).toBe(true);

    await act(async () => { resolveExport(); });
    expect(result.current.exporting).toBe(false);
  });

  it('calls shareAsync with the path returned by exportDatabase', async () => {
    const { result } = renderHook(() => useExportDatabase());
    await act(async () => { await result.current.exportData(); });

    expect(mockShareAsync).toHaveBeenCalledWith(
      'file:///cache/spuddy-backup-2026-06-05.db',
      expect.objectContaining({ mimeType: 'application/x-sqlite3' })
    );
  });

  it('sets error and clears exporting when exportDatabase throws', async () => {
    mockExportDatabase.mockRejectedValue(new Error('disk full'));
    const { result } = renderHook(() => useExportDatabase());
    await act(async () => { await result.current.exportData(); });

    expect(result.current.exporting).toBe(false);
    expect(result.current.error).toBe('disk full');
  });
});
