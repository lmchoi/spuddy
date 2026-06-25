import { getAllExerciseNames } from '@/src/exerciseStorage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ProgramDayDetailScreen, { AddExerciseSheet } from '../app/(tabs)/settings/[programId]/[dayIndex]';

// We use an external variable to set the *initial* state for our mock hook,
// so that the component can actually update its state during interactions.
let mockInitialDay: any;
let mockInitialLibraryData: any;

jest.mock('@/src/hooks/useProgramDay', () => ({
  useProgramDay: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    const [day, setDay] = React.useState(mockInitialDay);
    const [libraryData, setLibraryData] = React.useState(mockInitialLibraryData);
    return { day, setDay, libraryData, setLibraryData };
  },
}));

const mockGetProgramDay = jest.fn();
const mockUpdateProgramDay = jest.fn();
const mockGetExercisesLibraryData = jest.fn();

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/programStorage', () => ({
  getProgramDay: (...args: unknown[]) => mockGetProgramDay(...args),
  updateProgramDay: (...args: unknown[]) => mockUpdateProgramDay(...args),
}));
jest.mock('@/src/exerciseStorage', () => ({
  getExerciseNote: jest.fn(),
  setExerciseNote: jest.fn(),
  getExercisesLibraryData: (...args: unknown[]) => mockGetExercisesLibraryData(...args),
  getAllExerciseNames: jest.fn().mockReturnValue(['Bench Press', 'Squat']),
  setExerciseLibraryLink: jest.fn(),
}));
jest.mock('@/src/storage', () => ({ resolveOrCreateExercise: jest.fn() }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn().mockReturnValue({ programId: '1', dayIndex: '0' }),
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Library data matching the SAMPLE_DAY exercises:
// push=2 (Bench Press, Overhead Press), pull=1 (Pull-ups), unmatched=1 (Squat)
const SAMPLE_LIBRARY_DATA = [
  {
    name: 'Bench Press',
    libraryId: 'Barbell_Bench_Press_-_Medium_Grip',
    muscleGroups: JSON.stringify(['chest', 'shoulders', 'triceps']),
    equipment: 'barbell',
    libraryConfidence: 100,
  },
  {
    name: 'Overhead Press',
    libraryId: 'Standing_Military_Press',
    muscleGroups: JSON.stringify(['shoulders', 'triceps']),
    equipment: 'barbell',
    libraryConfidence: 100,
  },
  {
    name: 'Pull-ups',
    libraryId: 'Wide-Grip_Rear_Pull-Up',
    muscleGroups: JSON.stringify(['lats', 'biceps']),
    equipment: 'body only',
    libraryConfidence: 100,
  },
  // Squat: no entry → unmatched
];

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateProgramDay.mockResolvedValue(undefined);
  
  mockInitialDay = {
    name: 'Push Day',
    exercises: [
      {
        name: 'Bench Press',
        targets: [
          { reps: 5, weight: 80, restSeconds: 180 },
          { reps: 5, weight: 80, restSeconds: 180 },
          { reps: 5, weight: 80, restSeconds: 180 },
        ],
      },
      {
        name: 'Overhead Press',
        targets: [
          { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
          { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
          { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
          { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
        ],
      },
      {
        name: 'Pull-ups',
        targets: [
          { reps: 6, weight: 0 },
          { reps: 6, weight: 0 },
          { reps: 6, weight: 0 },
        ],
      },
      {
        name: 'Squat',
        targets: [],
      },
    ],
  };
  mockInitialLibraryData = new Map(SAMPLE_LIBRARY_DATA.map(r => [r.name, r]));
});

describe('ProgramDayDetail screen', () => {
  it('shows the sample day name', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('Push Day')).toBeTruthy();
  });

  it('renders all exercise names in collapsed state', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Overhead Press')).toBeTruthy();
    expect(screen.getByText('Pull-ups')).toBeTruthy();
    expect(screen.getByText('Squat')).toBeTruthy();
  });

  it('shows summary line for Bench Press (uniform reps, weight, rest)', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('3 × 5 @ 80 kg · rest 3 min')).toBeTruthy();
  });

  it('shows rep-range summary for Overhead Press', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('4 × 8–12 @ 40 kg · rest 90s')).toBeTruthy();
  });

  it('shows BW in summary for Pull-ups', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('3 × 6 BW')).toBeTruthy();
  });

  it('shows NO TARGETS text for exercises with empty targets', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('NO TARGETS · TAP + TO ADD')).toBeTruthy();
  });

  it('expands exercise to show column headers on tap', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    expect(screen.getByText('SET')).toBeTruthy();
    expect(screen.getByText('REPS')).toBeTruthy();
    expect(screen.getByText('WEIGHT')).toBeTruthy();
    expect(screen.getByText('REST')).toBeTruthy();
  });

  it('shows + Set and Delete exercise buttons when expanded', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    expect(screen.getByText('+ Set')).toBeTruthy();
    expect(screen.getByText('Delete exercise')).toBeTruthy();
  });

  it('adds a set when + Set is pressed', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    fireEvent.press(screen.getByText('+ Set'));
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('removes a set when × is pressed', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    const deleteButtons = screen.getAllByText('×');
    fireEvent.press(deleteButtons[deleteButtons.length - 1]); // remove last set
    expect(screen.queryByText('3')).toBeNull();
  });

  it('deletes exercise when Delete exercise is pressed', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    fireEvent.press(screen.getByText('Delete exercise'));
    expect(screen.queryByText('Bench Press')).toBeNull();
  });

  it('pressing + Add exercise opens the add-exercise sheet', async () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('+ Add exercise'));
    await act(async () => {});
    expect(screen.getByPlaceholderText('Exercise name')).toBeTruthy();
  });

  it('submitting a name in the sheet adds the exercise to the list', async () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('+ Add exercise'));
    await act(async () => {});
    fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Deadlift');
    fireEvent.press(screen.getByText("Create 'Deadlift'"));
    expect(screen.getByText('Deadlift')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Exercise name')).toBeNull();
  });

  it('dismissing the sheet leaves the exercise list unchanged', async () => {
    render(<ProgramDayDetailScreen />);
    const exerciseCount = screen.getAllByText('▸').length;
    fireEvent.press(screen.getByText('+ Add exercise'));
    await act(async () => {});
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.getAllByText('▸').length).toBe(exerciseCount);
    expect(screen.queryByPlaceholderText('Exercise name')).toBeNull();
  });

  it('tapping a library row calls resolveOrCreateExercise with the correct libraryId', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveOrCreateExercise } = require('@/src/storage');
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('+ Add exercise'));
    await act(async () => {});
    fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), '3/4 sit');
    fireEvent.press(await screen.findByText('3/4 Sit-Up'));
    await act(async () => {});
    expect(resolveOrCreateExercise).toHaveBeenCalledWith(expect.anything(), '3/4 Sit-Up', '3_4_Sit-Up');
  });
});

describe('bug regression: weight=0 during edit', () => {
  it('keeps the TextInput visible when weight is changed to 0 mid-edit', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]); 
    fireEvent.press(screen.getAllByText('80')[0]);
    const input = screen.getByDisplayValue('80');
    fireEvent.changeText(input, '0');
    expect(screen.queryByDisplayValue('0')).toBeTruthy();
  });
});

describe('bug regression: day name persistence', () => {
  it('persists the typed day name (not the pre-edit snapshot) to DB', async () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Push Day'));
    const input = screen.getByDisplayValue('Push Day');
    fireEvent.changeText(input, 'Leg Day');
    fireEvent(input, 'blur');
    await waitFor(() =>
      expect(mockUpdateProgramDay).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ name: 'Leg Day' })
      )
    );
  });
});

describe('bug regression: edit state clears on delete', () => {
  it('clears editingCell when an exercise is deleted', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    fireEvent.press(screen.getAllByText('5')[0]); 
    fireEvent.press(screen.getByText('Delete exercise'));
    fireEvent.press(screen.getAllByText('▸')[0]);
    expect(screen.queryByDisplayValue('12')).toBeNull();
  });

  it('clears editingCell when a set is removed', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    fireEvent.press(screen.getAllByText('5')[0]); 
    const deleteButtons = screen.getAllByText('×');
    fireEvent.press(deleteButtons[0]);
    expect(screen.queryByDisplayValue('5')).toBeNull();
  });
});

describe('exercise edit sheet', () => {
  it('opens sheet on exercise name tap', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Bench Press'));
    expect(screen.getByDisplayValue('Bench Press')).toBeTruthy();
  });

  it('closing the sheet does not toggle expand state', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Bench Press'));
    fireEvent.press(screen.getByText('dismiss'));
    expect(screen.queryByText('SET')).toBeNull();
  });

  it('shows library match card for a matched exercise', () => {
    mockInitialDay = {
      name: 'Push Day',
      exercises: [{ name: 'Bench Press', targets: [] }],
    };
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Bench Press'));
    expect(screen.getByText('Barbell Bench Press - Medium Grip')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('renders without crash when muscleGroups is malformed JSON', () => {
    mockInitialDay = {
      name: 'Push Day',
      exercises: [{ name: 'Bench Press', targets: [] }],
    };
    mockInitialLibraryData = new Map([
      ['Bench Press', {
        name: 'Bench Press',
        libraryId: 'some_id',
        muscleGroups: 'not valid json',
        equipment: 'barbell',
        libraryConfidence: 100,
      }]
    ]);
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Bench Press'));
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('shows no-match card for an unmatched exercise', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Squat'));
    expect(screen.getByText(/No library match found/)).toBeTruthy();
  });

  it('saves renamed exercise when Save name is pressed', async () => {
    mockInitialLibraryData = new Map(); // Clear matches for this test
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Bench Press'));
    const input = screen.getByDisplayValue('Bench Press');
    fireEvent.changeText(input, 'Incline Press');
    fireEvent.press(screen.getByText('Save name'));
    await waitFor(() => expect(screen.getByText('Incline Press')).toBeTruthy());
  });

  it('retains library match card after renaming a matched exercise', async () => {
    mockInitialDay = {
      name: 'Push Day',
      exercises: [{ name: 'Bench Press', targets: [] }],
    };
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Bench Press'));
    expect(screen.getByText('100%')).toBeTruthy();
    fireEvent.changeText(screen.getByDisplayValue('Bench Press'), 'Incline Press');
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() => {
      fireEvent.press(screen.getByText('Incline Press'));
      expect(screen.getByText('100%')).toBeTruthy();
    });
  });
});

describe('real data loading', () => {
  it('shows day name loaded from DB', () => {
    mockInitialDay = {
      name: 'Leg Day',
      exercises: [{ name: 'Squat', targets: [{ reps: 5, weight: 100 }] }],
    };
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('Leg Day')).toBeTruthy();
  });

  it('shows exercises loaded from DB', () => {
    mockInitialDay = {
      name: 'Leg Day',
      exercises: [
        { name: 'Squat', targets: [{ reps: 5, weight: 100 }] },
        { name: 'Leg Press', targets: [] },
      ],
    };
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('Squat')).toBeTruthy();
    expect(screen.getByText('Leg Press')).toBeTruthy();
  });

  it('calls updateProgramDay when a set is added', async () => {
    mockInitialDay = {
      name: 'Leg Day',
      exercises: [{ name: 'Squat', targets: [{ reps: 5, weight: 100 }] }],
    };
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('Squat')).toBeTruthy();
    fireEvent.press(screen.getAllByText('▸')[0]);
    fireEvent.press(screen.getByText('+ Set'));
    await waitFor(() => expect(mockUpdateProgramDay).toHaveBeenCalled());
  });
});

describe('exercise edit sheet — search library mode', () => {
  it('pressing "Search library" opens search mode for unmatched exercise', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Squat'));
    fireEvent.press(screen.getByText('Search library'));
    expect(screen.getByPlaceholderText('Search library')).toBeTruthy();
  });

  it('"Change match" opens search mode for matched exercise', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Bench Press'));
    fireEvent.press(screen.getByText('Change match'));
    expect(screen.getByPlaceholderText('Search library')).toBeTruthy();
  });

  it('tapping a result from Change match replaces the existing match card', async () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Bench Press'));
    fireEvent.press(screen.getByText('Change match'));
    fireEvent.changeText(screen.getByPlaceholderText('Search library'), '3/4 sit');
    fireEvent.press(await screen.findByText('3/4 Sit-Up'));
    await waitFor(() => expect(screen.getByText('3/4 Sit-Up')).toBeTruthy());
    expect(screen.queryByPlaceholderText('Search library')).toBeNull();
  });

  it('search mode renders results for a query', async () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Squat'));
    fireEvent.press(screen.getByText('Search library'));
    fireEvent.changeText(screen.getByPlaceholderText('Search library'), '3/4 sit');
    expect(await screen.findByText('3/4 Sit-Up')).toBeTruthy();
  });

  it('tapping a result updates match card and returns to edit mode', async () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Squat'));
    fireEvent.press(screen.getByText('Search library'));
    fireEvent.changeText(screen.getByPlaceholderText('Search library'), '3/4 sit');
    fireEvent.press(await screen.findByText('3/4 Sit-Up'));
    await waitFor(() => expect(screen.getByText('100%')).toBeTruthy());
    expect(screen.queryByPlaceholderText('Search library')).toBeNull();
  });

  it('match card shows library entry name not exercise name', async () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Squat'));
    fireEvent.press(screen.getByText('Search library'));
    fireEvent.changeText(screen.getByPlaceholderText('Search library'), '3/4 sit');
    fireEvent.press(await screen.findByText('3/4 Sit-Up'));
    // library name should appear in the match card (not in a search result, since search is gone)
    await waitFor(() => expect(screen.getByText('3/4 Sit-Up')).toBeTruthy());
    expect(screen.queryByPlaceholderText('Search library')).toBeNull();
  });

  it('dismiss in search mode returns to edit without linking', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Squat'));
    fireEvent.press(screen.getByText('Search library'));
    expect(screen.getByPlaceholderText('Search library')).toBeTruthy();
    fireEvent.press(screen.getByText('dismiss'));
    expect(screen.queryByPlaceholderText('Search library')).toBeNull();
    expect(screen.getByDisplayValue('Squat')).toBeTruthy();
  });

  it('dismiss after picking a result does not commit the link', async () => {
    const { setExerciseLibraryLink } = require('@/src/exerciseStorage');
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Squat'));
    fireEvent.press(screen.getByText('Search library'));
    fireEvent.changeText(screen.getByPlaceholderText('Search library'), '3/4 sit');
    fireEvent.press(await screen.findByText('3/4 Sit-Up'));
    // match card shows pending state
    await waitFor(() => expect(screen.getByText('3/4 Sit-Up')).toBeTruthy());
    // user dismisses without saving
    fireEvent.press(screen.getByText('dismiss'));
    expect(setExerciseLibraryLink).not.toHaveBeenCalled();
  });

  it('db write only happens on Save, not on pick', async () => {
    const { setExerciseLibraryLink } = require('@/src/exerciseStorage');
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Squat'));
    fireEvent.press(screen.getByText('Search library'));
    fireEvent.changeText(screen.getByPlaceholderText('Search library'), '3/4 sit');
    fireEvent.press(await screen.findByText('3/4 Sit-Up'));

    // match card shows immediately from local pending state
    await waitFor(() => expect(screen.getByText('100%')).toBeTruthy());
    // but db write has not happened yet
    expect(setExerciseLibraryLink).not.toHaveBeenCalled();

    // pressing Save commits the link
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() => expect(setExerciseLibraryLink).toHaveBeenCalled());
  });
});

describe('AddExerciseSheet component', () => {
  beforeEach(() => {
    (getAllExerciseNames as jest.Mock).mockReturnValue([]);
  });

  it('renders the name input', async () => {
    render(<AddExerciseSheet onAdd={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByPlaceholderText('Exercise name')).toBeTruthy();
    await act(async () => {});
  });

  it('renders history rows when history is non-empty', async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['Bench Press', 'Squat']);
    render(<AddExerciseSheet onAdd={jest.fn()} onCancel={jest.fn()} />);
    expect(await screen.findByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Squat')).toBeTruthy();
  });

  it('typing filters the history list', async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['Bench Press', 'Squat', 'Bent-over Row']);
    render(<AddExerciseSheet onAdd={jest.fn()} onCancel={jest.fn()} />);
    await screen.findByText('Bench Press');
    fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'ben');
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.queryByText('Squat')).toBeNull();
  });

  it('shows library section header with a query that matches library', async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue([]);
    render(<AddExerciseSheet onAdd={jest.fn()} onCancel={jest.fn()} />);
    await act(async () => {});
    fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), '3/4 sit');
    expect(screen.getByText('From library')).toBeTruthy();
  });

  it("shows Create 'x' row when no exact match", async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['Bench Press']);
    render(<AddExerciseSheet onAdd={jest.fn()} onCancel={jest.fn()} />);
    await act(async () => {});
    fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Cable Fly');
    expect(screen.getByText("Create 'Cable Fly'")).toBeTruthy();
  });

  it('tapping a history row calls onAdd with the exercise name', async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['Squat']);
    const onAdd = jest.fn();
    render(<AddExerciseSheet onAdd={onAdd} onCancel={jest.fn()} />);
    fireEvent.press(await screen.findByText('Squat'));
    expect(onAdd).toHaveBeenCalledWith('Squat');
  });

  it('tapping the backdrop calls onCancel', async () => {
    const onCancel = jest.fn();
    render(<AddExerciseSheet onAdd={jest.fn()} onCancel={onCancel} />);
    await act(async () => {});
    fireEvent.press(screen.getByTestId('add-exercise-sheet-backdrop'));
    expect(onCancel).toHaveBeenCalled();
  });
});
