import { z } from 'zod';
import { initializeLocalDatabase } from '@/data/localDatabase';
import { Project, ProjectStatus, Stage, SyncStatus } from '@/types/inspection';

const projectRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  owner_name: z.string(),
  owner_phone: z.string().nullable(),
  case_number: z.string().nullable(),
  building_permit_number: z.string().nullable(),
  renovation_code: z.string().nullable(),
  permit_date: z.string().nullable(),
  building_type: z.string(),
  number_of_floors: z.number(),
  start_date: z.string(),
  current_stage_id: z.string(),
  progress_percentage: z.number(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'SUSPENDED', 'ARCHIVED']),
  created_at: z.string(),
  updated_at: z.string(),
  last_visit_at: z.string().nullable(),
  sync_status: z.enum(['LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'ERROR']),
  open_violation_count: z.number(),
});

const stageRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  order_index: z.number(),
  is_active: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

type ProjectRow = z.infer<typeof projectRowSchema>;
type StageRow = z.infer<typeof stageRowSchema>;

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    ownerName: row.owner_name,
    ownerPhone: row.owner_phone ?? undefined,
    caseNumber: row.case_number ?? undefined,
    buildingPermitNumber: row.building_permit_number ?? undefined,
    renovationCode: row.renovation_code ?? undefined,
    permitDate: row.permit_date ?? undefined,
    buildingType: row.building_type,
    numberOfFloors: row.number_of_floors,
    startDate: row.start_date,
    currentStageId: row.current_stage_id,
    progressPercentage: row.progress_percentage,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastVisitAt: row.last_visit_at ?? undefined,
    syncStatus: row.sync_status,
    openViolationCount: row.open_violation_count,
  };
}

function toStage(row: StageRow): Stage {
  return {
    id: row.id,
    name: row.name,
    order: row.order_index,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listStages() {
  const db = await initializeLocalDatabase();
  const rows = await db.getAllAsync<StageRow>('SELECT * FROM stages WHERE is_active = 1 ORDER BY order_index ASC');
  return rows.flatMap((row) => {
    const parsed = stageRowSchema.safeParse(row);
    return parsed.success ? [toStage(parsed.data)] : [];
  });
}

export async function listProjects(options?: { query?: string; status?: ProjectStatus }) {
  const db = await initializeLocalDatabase();
  const clauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (options?.query?.trim()) {
    clauses.push('(name LIKE ? OR address LIKE ?)');
    const query = `%${options.query.trim()}%`;
    params.push(query, query);
  }
  if (options?.status) {
    clauses.push('status = ?');
    params.push(options.status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.getAllAsync<ProjectRow>(
    `SELECT * FROM projects ${where} ORDER BY updated_at DESC`,
    params,
  );
  return rows.flatMap((row) => {
    const parsed = projectRowSchema.safeParse(row);
    return parsed.success ? [toProject(parsed.data)] : [];
  });
}

export async function getProjectById(id: string) {
  const db = await initializeLocalDatabase();
  const row = await db.getFirstAsync<ProjectRow>('SELECT * FROM projects WHERE id = ?', id);
  if (!row) return null;
  const parsed = projectRowSchema.safeParse(row);
  return parsed.success ? toProject(parsed.data) : null;
}

export async function insertProject(project: Project) {
  const db = await initializeLocalDatabase();
  await db.runAsync(
    `INSERT INTO projects
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
  return project;
}

export async function updateProjectRecord(id: string, changes: Partial<Project>) {
  const existing = await getProjectById(id);
  if (!existing) throw new Error('Project not found');
  const next: Project = {
    ...existing,
    ...changes,
    id: existing.id,
    updatedAt: new Date().toISOString(),
    syncStatus: (changes.syncStatus ?? 'PENDING') as SyncStatus,
  };

  const db = await initializeLocalDatabase();
  await db.runAsync(
    `UPDATE projects SET
      name = ?, address = ?, owner_name = ?, owner_phone = ?, case_number = ?,
      building_permit_number = ?, renovation_code = ?, permit_date = ?,
      building_type = ?, number_of_floors = ?, start_date = ?, current_stage_id = ?,
      progress_percentage = ?, status = ?, created_at = ?, updated_at = ?,
      last_visit_at = ?, sync_status = ?, open_violation_count = ?
      WHERE id = ?`,
    [
      next.name,
      next.address,
      next.ownerName,
      next.ownerPhone ?? null,
      next.caseNumber ?? null,
      next.buildingPermitNumber ?? null,
      next.renovationCode ?? null,
      next.permitDate ?? null,
      next.buildingType,
      next.numberOfFloors,
      next.startDate,
      next.currentStageId,
      next.progressPercentage,
      next.status,
      next.createdAt,
      next.updatedAt,
      next.lastVisitAt ?? null,
      next.syncStatus,
      next.openViolationCount,
      id,
    ],
  );
  return next;
}