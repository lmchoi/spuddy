export const migrations = {
  journal: {
    version: '7',
    dialect: 'sqlite',
    entries: [
      {
        idx: 0,
        version: '6',
        when: 1780135301055,
        tag: '0000_new_namor',
        breakpoints: true,
      },
      {
        idx: 1,
        version: '6',
        when: 1780221701055,
        tag: '0001_exercise_notes',
        breakpoints: true,
      },
      {
        idx: 2,
        version: '6',
        when: 1780308101055,
        tag: '0002_exercise_library',
        breakpoints: true,
      },
      {
        idx: 3,
        version: '6',
        when: 1781018447278,
        tag: '0003_typical_skaar',
        breakpoints: true,
      },
      {
        idx: 4,
        version: '6',
        when: 1781134023152,
        tag: '0004_spotty_machine_man',
        breakpoints: true,
      },
      {
        idx: 5,
        version: '6',
        when: 1781136062929,
        tag: '0005_bouncy_shadowcat',
        breakpoints: true,
      },
    ],
  },
  migrations: {
    m0000:
      'CREATE TABLE `exercises` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`name` text NOT NULL\n);\n--> statement-breakpoint\nCREATE UNIQUE INDEX `exercises_name_unique` ON `exercises` (`name`);--> statement-breakpoint\nCREATE TABLE `program_days` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`program_id` integer NOT NULL,\n\t`day_index` integer NOT NULL,\n\t`name` text NOT NULL,\n\tFOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE TABLE `program_exercises` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`program_day_id` integer NOT NULL,\n\t`exercise_index` integer NOT NULL,\n\t`exercise_id` integer NOT NULL,\n\t`targets_json` text NOT NULL,\n\tFOREIGN KEY (`program_day_id`) REFERENCES `program_days`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE TABLE `programs` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`name` text NOT NULL,\n\t`active_day_index` integer DEFAULT 0 NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE `sessions` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`date` text NOT NULL,\n\t`exercise_id` integer NOT NULL,\n\t`sets_json` text NOT NULL,\n\t`targets_json` text NOT NULL,\n\tFOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE INDEX `idx_sessions_date` ON `sessions` (`date`);--> statement-breakpoint\nCREATE INDEX `idx_sessions_exercise` ON `sessions` (`exercise_id`);',
    m0001: 'ALTER TABLE `exercises` ADD `notes` text;',
    m0002:
      'ALTER TABLE `exercises` ADD `muscle_groups` text;\n--> statement-breakpoint\nALTER TABLE `exercises` ADD `equipment` text;\n--> statement-breakpoint\nALTER TABLE `exercises` ADD `library_id` text;\n--> statement-breakpoint\nALTER TABLE `exercises` ADD `library_confidence` integer;',
    m0003:
      "ALTER TABLE `sessions` ADD `source` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint\nALTER TABLE `sessions` ADD `source_id` text;--> statement-breakpoint\nCREATE UNIQUE INDEX `idx_sessions_source_id` ON `sessions` (`source`,`source_id`);",
    m0004: 'ALTER TABLE `programs` ADD `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL;',
    m0005:
      'PRAGMA foreign_keys=OFF;--> statement-breakpoint\nCREATE TABLE `__new_programs` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`name` text NOT NULL,\n\t`active_day_index` integer DEFAULT 0 NOT NULL,\n\t`created_at` integer DEFAULT (cast((julianday(\'now\') - 2440587.5)*86400000 as integer)) NOT NULL\n);\n--> statement-breakpoint\nINSERT INTO `__new_programs`("id", "name", "active_day_index", "created_at") SELECT "id", "name", "active_day_index", "created_at" FROM `programs`;--> statement-breakpoint\nDROP TABLE `programs`;--> statement-breakpoint\nALTER TABLE `__new_programs` RENAME TO `programs`;--> statement-breakpoint\nPRAGMA foreign_keys=ON;',
  },
};
