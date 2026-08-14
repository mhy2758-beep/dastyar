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
    visit_date TEXT NOT NULL DEFAULT '',
    start_time TEXT,
    end_time TEXT,
    title TEXT NOT NULL DEFAULT '',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    visited_at TEXT,
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
    visit_id TEXT NOT NULL,
    local_uri TEXT NOT NULL,
    file_name TEXT NOT NULL DEFAULT '',
    captured_at TEXT NOT NULL DEFAULT '',
    latitude REAL,
    longitude REAL,
    caption TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'LOCAL',
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (visit_id) REFERENCES visits(id)
  );

  CREATE TABLE IF NOT EXISTS checklist_templates (
    id TEXT PRIMARY KEY NOT NULL,
    stage_id TEXT NOT NULL,
    name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (stage_id) REFERENCES stages(id)
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY NOT NULL,
    template_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    description TEXT,
    label TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
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
    visit_id TEXT,
    checklist_item_id TEXT,
    item_id TEXT NOT NULL,
    item_title TEXT NOT NULL DEFAULT '',
    item_description TEXT,
    item_order_index INTEGER NOT NULL DEFAULT 0,
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
    type TEXT NOT NULL DEFAULT 'TEXT',
    text TEXT NOT NULL DEFAULT '',
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
  CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
  CREATE INDEX IF NOT EXISTS idx_photos_project ON photos(project_id);
  CREATE INDEX IF NOT EXISTS idx_photos_visit ON photos(visit_id);
  CREATE INDEX IF NOT EXISTS idx_notes_visit ON notes(visit_id);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
`;

const checklistSeedItems: Record<string, string[]> = {
  'stage-1': ['بررسی بستر و خاک‌برداری', 'کنترل آرماتورهای فونداسیون', 'کنترل قالب‌بندی و ابعاد فونداسیون'],
  'stage-2': ['کنترل اجرای ستون‌ها و تیرها', 'بررسی اتصالات و جوشکاری', 'کنترل شاقول و تراز اسکلت'],
  'stage-3': ['کنترل آرماتوربندی سقف', 'بررسی بازشوها و غلاف‌ها', 'کنترل بتن‌ریزی و عمل‌آوری'],
  'stage-4': ['کنترل دیوارچینی و مصالح', 'بررسی بازشوهای در و پنجره', 'کنترل اجرای عایق‌کاری'],
  'stage-5': ['کنترل مسیر لوله‌های آب و فاضلاب', 'بررسی لوله‌گذاری برق و تابلوها', 'کنترل مسیر کانال‌ها و تجهیزات مکانیکی'],
  'stage-6': ['بررسی زیرسازی نما', 'کنترل اتصالات و مهار نما', 'کنترل آب‌بندی و جزئیات اجرایی'],
  'stage-7': ['کنترل کف‌سازی و شیب‌بندی', 'بررسی اجرای دیوار و سقف کاذب', 'کنترل کیفیت نهایی مصالح'],
  'stage-8': ['کنترل تکمیل موارد باقی‌مانده', 'بررسی ایمنی و دسترسی ساختمان', 'ثبت جمع‌بندی بازدید نهایی'],
};

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

async function ensureColumn(db: SQLite.SQLiteDatabase, table: string, column: string, definition: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function migratePhase3Columns(db: SQLite.SQLiteDatabase) {
  const columns = [
    ['visits', 'visit_date', "TEXT NOT NULL DEFAULT ''"],
    ['visits', 'start_time', 'TEXT'],
    ['visits', 'end_time', 'TEXT'],
    ['visits', 'title', "TEXT NOT NULL DEFAULT ''"],
    ['visits', 'description', 'TEXT'],
    ['photos', 'file_name', "TEXT NOT NULL DEFAULT ''"],
    ['photos', 'captured_at', "TEXT NOT NULL DEFAULT ''"],
    ['photos', 'latitude', 'REAL'],
    ['photos', 'longitude', 'REAL'],
    ['photos', 'updated_at', "TEXT NOT NULL DEFAULT ''"],
    ['photos', 'sync_status', "TEXT NOT NULL DEFAULT 'LOCAL'"],
    ['checklist_templates', 'is_active', 'INTEGER NOT NULL DEFAULT 1'],
    ['checklist_items', 'title', "TEXT NOT NULL DEFAULT ''"],
    ['checklist_items', 'description', 'TEXT'],
    ['checklist_items', 'is_active', 'INTEGER NOT NULL DEFAULT 1'],
    ['checklist_records', 'visit_id', 'TEXT'],
    ['checklist_records', 'checklist_item_id', 'TEXT'],
    ['checklist_records', 'item_title', "TEXT NOT NULL DEFAULT ''"],
    ['checklist_records', 'item_description', 'TEXT'],
    ['checklist_records', 'item_order_index', 'INTEGER NOT NULL DEFAULT 0'],
    ['notes', 'type', "TEXT NOT NULL DEFAULT 'TEXT'"],
    ['notes', 'text', "TEXT NOT NULL DEFAULT ''"],
  ] as const;

  for (const [table, column, definition] of columns) {
    await ensureColumn(db, table, column, definition);
  }
}

async function seedDefaultChecklists(db: SQLite.SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    for (const [stageId, itemTitles] of Object.entries(checklistSeedItems)) {
      const now = new Date().toISOString();
      const templateId = `template-${stageId}-v1`;
      await db.runAsync(
        `INSERT OR IGNORE INTO checklist_templates
          (id, stage_id, name, version, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [templateId, stageId, `چک‌لیست ${stageId}`, 1, 1, now, now],
      );

      for (const [index, title] of itemTitles.entries()) {
        const itemId = `${templateId}-item-${index + 1}`;
        await db.runAsync(
          `INSERT OR IGNORE INTO checklist_items
            (id, template_id, title, description, label, order_index, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, templateId, title, null, title, index + 1, 1, now, now],
        );
      }
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
      await migratePhase3Columns(db);
      await seedDefaultStages(db);
      await seedDefaultChecklists(db);
      await migrateLegacyProjects(db);
      return db;
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }
  return initializationPromise;
}