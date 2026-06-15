export const migrations = {
  journal: {
    entries: [
      { idx: 0, when: 1780135301055, tag: '0000_new_namor', breakpoints: true },
      { idx: 1, when: 1780221701055, tag: '0001_exercise_notes', breakpoints: true },
      { idx: 2, when: 1780308101055, tag: '0002_exercise_library', breakpoints: true },
      { idx: 3, when: 1781018447278, tag: '0003_typical_skaar', breakpoints: true },
      { idx: 4, when: 1781305730614, tag: '0004_wet_stryfe', breakpoints: true },
    ],
  },
  migrations: {
    m0000: `CREATE TABLE \`exercises\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`exercises_name_unique\` ON \`exercises\` (\`name\`);--> statement-breakpoint
CREATE TABLE \`program_days\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`program_id\` integer NOT NULL,
	\`day_index\` integer NOT NULL,
	\`name\` text NOT NULL,
	FOREIGN KEY (\`program_id\`) REFERENCES \`programs\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`program_exercises\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`program_day_id\` integer NOT NULL,
	\`exercise_index\` integer NOT NULL,
	\`exercise_id\` integer NOT NULL,
	\`targets_json\` text NOT NULL,
	FOREIGN KEY (\`program_day_id\`) REFERENCES \`program_days\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`exercise_id\`) REFERENCES \`exercises\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`programs\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text NOT NULL,
	\`active_day_index\` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`sessions\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`date\` text NOT NULL,
	\`exercise_id\` integer NOT NULL,
	\`sets_json\` text NOT NULL,
	\`targets_json\` text NOT NULL,
	FOREIGN KEY (\`exercise_id\`) REFERENCES \`exercises\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`idx_sessions_date\` ON \`sessions\` (\`date\`);--> statement-breakpoint
CREATE INDEX \`idx_sessions_exercise\` ON \`sessions\` (\`exercise_id\`);`,
    m0001: `ALTER TABLE \`exercises\` ADD \`notes\` text;`,
    m0002: `ALTER TABLE \`exercises\` ADD \`muscle_groups\` text;
--> statement-breakpoint
ALTER TABLE \`exercises\` ADD \`equipment\` text;
--> statement-breakpoint
ALTER TABLE \`exercises\` ADD \`library_id\` text;
--> statement-breakpoint
ALTER TABLE \`exercises\` ADD \`library_confidence\` integer;`,
    m0003: `ALTER TABLE \`sessions\` ADD \`source\` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE \`sessions\` ADD \`source_id\` text;--> statement-breakpoint
CREATE UNIQUE INDEX \`idx_sessions_source_id\` ON \`sessions\` (\`source\`,\`source_id\`);`,
    m0004: `ALTER TABLE \`programs\` ADD \`created_at\` integer DEFAULT (unixepoch()) NOT NULL;`,
  },
};
