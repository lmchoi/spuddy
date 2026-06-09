import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').unique().notNull(),
  notes: text('notes'),
  muscleGroups: text('muscle_groups'),
  equipment: text('equipment'),
  libraryId: text('library_id'),
  libraryConfidence: integer('library_confidence'),
});

export const sessions = sqliteTable(
  'sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id),
    setsJson: text('sets_json').notNull(),
    targetsJson: text('targets_json').notNull(),
    source: text('source').notNull().default('manual'),
    sourceId: text('source_id'),
  },
  t => [
    index('idx_sessions_date').on(t.date),
    index('idx_sessions_exercise').on(t.exerciseId),
    unique('idx_sessions_source_id').on(t.source, t.sourceId),
  ]
);

export const programs = sqliteTable('programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  activeDayIndex: integer('active_day_index').notNull().default(0),
});

export const programDays = sqliteTable('program_days', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programId: integer('program_id')
    .notNull()
    .references(() => programs.id),
  dayIndex: integer('day_index').notNull(),
  name: text('name').notNull(),
});

export const programExercises = sqliteTable('program_exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programDayId: integer('program_day_id')
    .notNull()
    .references(() => programDays.id),
  exerciseIndex: integer('exercise_index').notNull(),
  exerciseId: integer('exercise_id')
    .notNull()
    .references(() => exercises.id),
  targetsJson: text('targets_json').notNull(),
});
