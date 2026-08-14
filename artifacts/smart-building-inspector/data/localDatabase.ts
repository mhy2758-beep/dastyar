import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { z } from 'zod';
import { DEFAULT_STAGES, initialProjects, Project } from '@/types/inspection';

const DATABASE_NAME = 'inspector.db';
const LEGACY_PROJECTS_KEY = '@inspector/projects';
const MIGRATION_KEY = '@inspector/sqlite-migration-v1';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializationPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const legacyProjectListSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    ownerName: z.string(),
    ownerPhone: z.string().optional(),
    caseNumber: z.string().optional(),
    buildingPermitNumber: z.string().optional(),
    renovationCode: z.string().optional(),
    permitDate: z.string().optional(),
    buildingType: z.string(),
    numberOfFloors: z.number(),
    startDate: z.string(),
    currentStageId: z.string(),
    progressPercentage: z.number(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'SUSPENDED', 'ARCHIVED']),
    createdAt: z.string(),
    updatedAt: z.string(),
    lastVisitAt: z.string().optional(),
    openViolationCount: z.number().optional(),
    syncStatus: z.enum(['LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'ERROR']).optional(),
  }),
);

function database() {
  if (Platform.OS === 'web') {
    throw new Error('SQLite is only available on native platforms in this phase.');
  }
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return databasePromise;
}

const schemaSql = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS stages (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_phone TEXT,
    case_number TEXT,
    building_permit_number TEXT,
    renovation_code TEXT,
    permit_date TEXT,
    building_type TEXT NOT NULL,
    number_of_floors INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    current_stage_id TEXT NOT NULL,
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_visit_at TEXT,
    sync_status TEXT NOT NULL DEFAULT 'LOCAL',
    open_violation_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (current_stage_id) REFERENCES stages(id)
  );

  CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    stage_id TEXT,
    visited_at TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    sync_status TEXT NOT NULL DEFAULT 'LOCAL',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (stage_id) REFERENCES stages(id)
  );

  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    visit_id TEXT,
    local_uri TEXT NOT NULL,
    caption TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (visit_id) REFERENCES visits(id)
  );

  CREATE TABLE IF NOT EXISTS checklist_templates (
    id TEXT PRIMARY KEY NOT NULL,
    stage_id TEXT NOT NULL,
    name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (stage_id) REFERENCES stages(id)
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY NOT NULL,
    template_id TEXT NOT NULL,
    label TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (template_id) REFERENCES checklist_templates(id)
  );

  CREATE TABLE IF NOT EXISTS checklist_snapshots (
    id TEXT PRIMARY KEY NOT NULL,
    visit_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (visit_id) REFERENCES visits(id),
    FOREIGN KEY (template_id) REFERENCES checklist_templates(id)
  );

  CREATE TABLE IF NOT EXISTS checklist_records (
    id TEXT PRIMARY KEY NOT NULL,
    snapshot_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (snapshot_id) REFERENCES checklist_snapshots(id),
    FOREIGN KEY (item_id) REFERENCES checklist_items(id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    visit_id TEXT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'LOCAL',
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (visit_id) REFERENCES visits(id)
  );

  CREATE TABLE IF NOT EXISTS voice_notes (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    visit_id TEXT,
    local_uri TEXT NOT NULL,
    transcript TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'LOCAL',
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (visit_id) REFERENCES visits(id)
  );

  CREATE TABLE IF NOT EXISTS violations (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    visit_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'LOCAL',
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (visit_id) REFERENCES visits(id)
  );

  CREATE TABLE IF NOT EXISTS violation_photos (
    violation_id TEXT NOT NULL,
    photo_id TEXT NOT NULL,
    PRIMARY KEY (violation_id, photo_id),
    FOREIGN KEY (violation_id) REFERENCES violations(id),
    FOREIGN KEY (photo_id) REFERENCES photos(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    visit_id TEXT,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    local_uri TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'LOCAL',
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (visit_id) REFERENCES visits(id)
  );

  CREATE TABLE IF NOT EXISTS project_documents (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    local_uri TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'LOCAL',
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(current_stage_id);
  CREATE INDEX IF NOT EXISTS idx_stages_order ON stages(order_index);
  CREATE INDEX IF NOT EXISTS idx_visits_project ON visits(project_id);
  CREATE INDEX IF NOT EXISTS idx_photos_project ON photos(project_id);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
`;

async function seedDefaultStages(db: SQLite.SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    for (const stage of DEFAULT_STAGES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO stages
          (id, name, order_index, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
        [
          stage.id,
          stage.name,
          stage.order,
          stage.isActive ? 1 : 0,
          stage.createdAt,
          stage.updatedAt,
        ],
      );
    }
  });
}

function normalizeLegacyProject(project: z.infer<typeof legacyProjectListSchema>[number]): Project {
  return {
    ...project,
    ownerPhone: project.ownerPhone ?? undefined,
    caseNumber: project.caseNumber ?? undefined,
    buildingPermitNumber: project.buildingPermitNumber ?? undefined,
    renovationCode: project.renovationCode ?? undefined,
    permitDate: project.permitDate ?? undefined,
    lastVisitAt: project.lastVisitAt ?? undefined,
    openViolationCount: project.openViolationCount ?? 0,
    syncStatus: project.syncStatus ?? 'LOCAL',
  };
}

async function migrateLegacyProjects(db: SQLite.SQLiteDatabase) {
  const migrationComplete = await AsyncStorage.getItem(MIGRATION_KEY);
  if (migrationComplete === 'complete') return;

  const stored = await AsyncStorage.getItem(LEGACY_PROJECTS_KEY);
  const sourceProjects = stored ? safeParseLegacyProjects(stored) : initialProjects;

  await db.withTransactionAsync(async () => {
    for (const project of sourceProjects) {
      await db.runAsync(
        `INSERT OR IGNORE INTO projects
          (id, name, address, owner_name, owner_phone, case_number,
           building_permit_number, renovation_code, permit_date, building_type,
           number_of_floors, start_date, current_stage_id, progress_percentage,
           status, created_at, updated_at, last_visit_at, sync_status, open_violation_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id,
          project.name,
          project.address,
          project.ownerName,
          project.ownerPhone ?? null,
          project.caseNumber ?? null,
          project.buildingPermitNumber ?? null,
          project.renovationCode ?? null,
          project.permitDate ?? null,
          project.buildingType,
          project.numberOfFloors,
          project.startDate,
          project.currentStageId,
          project.progressPercentage,
          project.status,
          project.createdAt,
          project.updatedAt,
          project.lastVisitAt ?? null,
          project.syncStatus,
          project.openViolationCount,
        ],
      );
    }
  });

  await AsyncStorage.setItem(MIGRATION_KEY, 'complete');
}

function safeParseLegacyProjects(value: string): Project[] {
  try {
    const parsed = legacyProjectListSchema.safeParse(JSON.parse(value));
    if (!parsed.success) return [];
    return parsed.data.map(normalizeLegacyProject);
  } catch {
    return [];
  }
}

export async function initializeLocalDatabase() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const db = await database();
      await db.execAsync(schemaSql);
      await seedDefaultStages(db);
      await migrateLegacyProjects(db);
      return db;
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }
  return initializationPromise;
}