import { z } from 'zod';
import { initializeLocalDatabase } from '@/data/localDatabase';
import { ChecklistItemStatus, SyncStatus, Visit, VisitStatus, createLocalId } from '@/types/inspection';

const visitRowSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  stage_id: z.string(),
  visit_date: z.string(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['OPEN', 'COMPLETED', 'CANCELLED']),
  created_at: z.string(),
  updated_at: z.string(),
  sync_status: z.enum(['LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'ERROR']),
  stage_name: z.string(),
  checklist_completed_count: z.number(),
  checklist_total_count: z.number(),
  open_violation_count: z.number(),
});

const visitSelect = `
  SELECT
    v.*,
    s.name AS stage_name,
    COALESCE((
      SELECT COUNT(*)
      FROM checklist_records cr
      WHERE cr.visit_id = v.id AND cr.status IN ('PASS', 'FAIL', 'NOT_APPLICABLE')
    ), 0) AS checklist_completed_count,
    COALESCE((
      SELECT COUNT(*)
      FROM checklist_records cr
      WHERE cr.visit_id = v.id
    ), 0) AS checklist_total_count,
    COALESCE((
      SELECT COUNT(*)
      FROM violations violation
      WHERE violation.visit_id = v.id AND violation.status = 'OPEN'
    ), 0) AS open_violation_count
  FROM visits v
  INNER JOIN stages s ON s.id = v.stage_id
`;

function toVisit(row: z.infer<typeof visitRowSchema>): Visit {
  return {
    id: row.id,
    projectId: row.project_id,
    stageId: row.stage_id,
    visitDate: row.visit_date,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    checklistCompletedCount: row.checklist_completed_count,
    checklistTotalCount: row.checklist_total_count,
    openViolationCount: row.open_violation_count,
  };
}

export type VisitInput = {
  projectId: string;
  stageId: string;
  visitDate: string;
  startTime?: string;
  endTime?: string;
  title: string;
  description?: string;
};

async function getVisit(db: Awaited<ReturnType<typeof initializeLocalDatabase>>, id: string) {
  const row = await db.getFirstAsync<z.infer<typeof visitRowSchema>>(`${visitSelect} WHERE v.id = ?`, id);
  if (!row) return null;
  const parsed = visitRowSchema.safeParse(row);
  return parsed.success ? toVisit(parsed.data) : null;
}

export async function listVisitsForProject(projectId: string) {
  const db = await initializeLocalDatabase();
  const rows = await db.getAllAsync<z.infer<typeof visitRowSchema>>(
    `${visitSelect} WHERE v.project_id = ? ORDER BY v.visit_date DESC, v.created_at DESC`,
    projectId,
  );
  return rows.flatMap((row) => {
    const parsed = visitRowSchema.safeParse(row);
    return parsed.success ? [toVisit(parsed.data)] : [];
  });
}

export async function getVisitById(id: string) {
  const db = await initializeLocalDatabase();
  return getVisit(db, id);
}

export async function createVisit(input: VisitInput) {
  const db = await initializeLocalDatabase();
  const now = new Date().toISOString();
  const visitId = createLocalId('visit');

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO visits
        (id, project_id, stage_id, visit_date, start_time, end_time, title,
         description, status, visited_at, notes, sync_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visitId,
        input.projectId,
        input.stageId,
        input.visitDate,
        input.startTime ?? null,
        input.endTime ?? null,
        input.title,
        input.description ?? null,
        'OPEN',
        input.visitDate,
        input.description ?? null,
        'LOCAL',
        now,
        now,
      ],
    );

    const template = await db.getFirstAsync<{ id: string }>(
      `SELECT id
       FROM checklist_templates
       WHERE stage_id = ? AND is_active = 1
       ORDER BY version DESC, updated_at DESC
       LIMIT 1`,
      input.stageId,
    );
    if (!template) {
      throw new Error('No active checklist template exists for this stage.');
    }

    const snapshotId = createLocalId('snapshot');
    await db.runAsync(
      `INSERT INTO checklist_snapshots (id, visit_id, template_id, created_at)
       VALUES (?, ?, ?, ?)`,
      [snapshotId, visitId, template.id, now],
    );

    const items = await db.getAllAsync<{
      id: string;
      title: string;
      description: string | null;
      label: string;
      order_index: number;
    }>(
      `SELECT id, title, description, label, order_index
       FROM checklist_items
       WHERE template_id = ? AND is_active = 1
       ORDER BY order_index ASC`,
      template.id,
    );

    for (const item of items) {
      const itemTitle = item.title || item.label;
      await db.runAsync(
        `INSERT INTO checklist_records
          (id, visit_id, snapshot_id, checklist_item_id, item_id, item_title,
           item_description, item_order_index, status, note, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          createLocalId('check'),
          visitId,
          snapshotId,
          item.id,
          item.id,
          itemTitle,
          item.description ?? null,
          item.order_index,
          'PENDING',
          null,
          now,
          now,
        ],
      );
    }
  });

  const visit = await getVisit(db, visitId);
  if (!visit) throw new Error('Created visit could not be loaded.');
  return visit;
}

export async function updateVisit(
  id: string,
  changes: Partial<Pick<Visit, 'visitDate' | 'startTime' | 'endTime' | 'title' | 'description' | 'status'>>,
) {
  const db = await initializeLocalDatabase();
  const existing = await getVisit(db, id);
  if (!existing) throw new Error('Visit not found.');
  const next = {
    ...existing,
    ...changes,
    updatedAt: new Date().toISOString(),
    syncStatus: 'PENDING' as SyncStatus,
  };

  await db.runAsync(
    `UPDATE visits
     SET visit_date = ?, start_time = ?, end_time = ?, title = ?, description = ?,
         status = ?, visited_at = ?, notes = ?, updated_at = ?, sync_status = ?
     WHERE id = ?`,
    [
      next.visitDate,
      next.startTime ?? null,
      next.endTime ?? null,
      next.title,
      next.description ?? null,
      next.status,
      next.visitDate,
      next.description ?? null,
      next.updatedAt,
      next.syncStatus,
      id,
    ],
  );
  return getVisit(db, id);
}

export async function completeVisit(id: string) {
  return updateVisit(id, { status: 'COMPLETED' satisfies VisitStatus });
}

export const checklistStatuses: ChecklistItemStatus[] = ['PENDING', 'PASS', 'FAIL', 'NOT_APPLICABLE'];