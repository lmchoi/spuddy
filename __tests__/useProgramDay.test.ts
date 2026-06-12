import { renderHook, waitFor } from '@testing-library/react-native';
import { useProgramDay, SAMPLE_DAY } from '../src/hooks/useProgramDay';
import { getDB } from '../src/db';
import { getProgramDay } from '../src/programStorage';
import { getExercisesLibraryData } from '../src/exerciseStorage';

jest.mock('../src/db');
jest.mock('../src/programStorage');
jest.mock('../src/exerciseStorage');
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useFocusEffect: jest.fn((cb) => {
      React.useEffect(cb, [cb]);
    })
  };
});

const mockGetDB = getDB as jest.MockedFunction<typeof getDB>;
const mockGetProgramDay = getProgramDay as jest.MockedFunction<typeof getProgramDay>;
const mockGetExercisesLibraryData = getExercisesLibraryData as jest.MockedFunction<typeof getExercisesLibraryData>;

describe('useProgramDay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns SAMPLE_DAY before DB responds', async () => {
    let resolveDB: (db: any) => void;
    mockGetDB.mockReturnValue(new Promise(resolve => {
      resolveDB = resolve;
    }));

    const { result } = renderHook(() => useProgramDay(1, 0));

    expect(result.current.day).toEqual(SAMPLE_DAY);
    expect(result.current.libraryData.size).toBe(0);

    resolveDB!({} as any);
  });

  it('updates day and libraryData once DB resolves', async () => {
    const mockDb = {} as any;
    const mockDay = { name: 'Fetched Day', exercises: [{ name: 'Squat', targets: [] }] };
    const mockLibraryData = [{ name: 'Squat', libraryId: '1', libraryConfidence: 100, muscleGroups: 'legs' }];

    mockGetDB.mockResolvedValue(mockDb);
    mockGetProgramDay.mockResolvedValue(mockDay as any);
    mockGetExercisesLibraryData.mockReturnValue(mockLibraryData as any);

    const { result } = renderHook(() => useProgramDay(1, 0));

    await waitFor(() => {
      expect(result.current.day).toEqual(mockDay);
    });

    expect(result.current.libraryData.get('Squat')).toEqual(mockLibraryData[0]);
    expect(mockGetProgramDay).toHaveBeenCalledWith(mockDb, 1, 0);
    expect(mockGetExercisesLibraryData).toHaveBeenCalledWith(mockDb, ['Squat']);
  });

  it('re-fetches when programId or idx changes', async () => {
    const mockDb = {} as any;
    mockGetDB.mockResolvedValue(mockDb);
    mockGetProgramDay.mockResolvedValue({ name: 'Init', exercises: [] } as any);
    mockGetExercisesLibraryData.mockReturnValue([]);

    const { rerender } = renderHook(
      ({ id, idx }: { id: number; idx: number }) => useProgramDay(id, idx),
      { initialProps: { id: 1, idx: 0 } }
    );

    await waitFor(() => {
      expect(mockGetProgramDay).toHaveBeenCalledWith(mockDb, 1, 0);
    });

    mockGetProgramDay.mockClear();
    mockGetExercisesLibraryData.mockClear();

    rerender({ id: 2, idx: 1 });

    await waitFor(() => {
      expect(mockGetProgramDay).toHaveBeenCalledWith(mockDb, 2, 1);
    });
  });
});
