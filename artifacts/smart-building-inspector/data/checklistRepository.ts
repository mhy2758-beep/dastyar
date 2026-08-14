import { z } from 'zod';
import { initializeLocalDatabase } from '@/data/localDatabase';
import { ChecklistItem, ChecklistItemStatus, ChecklistRecord, ChecklistTemplate, createLocalId } from '@/types/inspection';

const templateRowSchema = z.object({
  id: z.string(),
  stage_id: z.string(),
  name: z.string(),
  version: z.number(),
  is_active: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

const itemRowSchema = z.object({
  id: z.string(),
  template_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  label: z.string(),
  order_index: z.number(),
  is_active: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

const recordRowSchema = z.object({
  id: z.string(),
  visit_id: z.string(),
  snapshot_id: z.string(),
  checklist_item_id: z.string().nullable(),
  item_id: z.string(),
  item_title: z.string(),
  item_description: z.string().nullable(),
  item_order_index: z.number(),
  status: z.enum(['PENDING', 'PASS', 'FAIL', 'NOT_APPLICABLE']),
  note: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

function toTemplate(row: z.infer<typeof templateRowSchema>): ChecklistTemplate {
  return {
    id: row.id,
    stageId: row.stage_id,
    name: row.name,
    version: row.version,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toItem(row: z.infer<typeof itemRowSchema>): ChecklistItem {
  return {
    id: row.id,
    templateId: row.template_id,
    title: row.title || row.label,
    description: row.description ?? undefined,
    orderIndex: row.order_index,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRecord(row: z.infer<typeof recordRowSchema>): ChecklistRecord {
  return {
    id: row.id,
    visitId: row.visit_id,
    snapshotId: row.snapshot_id,
    checklistItemId: row.checklist_item_id ?? row.item_id,
    title: row.item_title,
    description: row.item_description ?? undefined,
    orderIndex: row.item_order_index,
    status: row.status,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActiveTemplateForStage(stageId: string) {
  const db = await initializeLocalDatabase();
  const row = await db.getFirstAsync<z.infer<typeof templateRowSchema>>(
    `SELECT * FROM checklist_templates
     WHERE stage_id = ? AND is_active = 1
     ORDER BY version DESC, updated_at DESC LIMIT 1`,
    stageId,
  );
  if (!row) return null;
  const parsed = templateRowSchema.safeParse(row);
  return parsed.success ? toTemplate(parsed.data) : null;
}

export async function listChecklistItemsForStage(stageId: string) {
  const db = await initializeLocalDatabase();
  const rows = await db.getAllAsync<z.infer<typeof itemRowSchema>>(
    `SELECT ci.*
     FROM checklist_items ci
     INNER JOIN checklist_templates ct ON ct.id = ci.template_id
     WHERE ct.stage_id = ? AND ct.is_active = 1 AND ci.is_active = 1
     ORDER BY ci.order_index ASC`,
    stageId,
  );
  return rows.flatMap((row) => {
    const parsed = itemRowSchema.safeParse(row);
    return parsed.success ? [toItem(parsed.data)] : [];
  });
}

export async function listChecklistRecordsForVisit(visitId: string) {
  const db = await initializeLocalDatabase();
  const rows = await db.getAllAsync<z.infer<typeof recordRowSchema>>(
    `SELECT id, visit_id, snapshot_id, checklist_item_id, item_id, item_title,
            item_description, item_order_index, status, note, created_at, updated_at
     FROM checklist_records
     WHERE visit_id = ?
     ORDER BY item_order_index ASC, created_at ASC`,
    visitId,
  );
  return rows.flatMap((row) => {
    const parsed = recordRowSchema.safeParse(row);
    return parsed.success ? [toRecord(parsed.data)] : [];
  });
}

export async function updateChecklistRecord(
  id: string,
  changes: { status?: ChecklistItemStatus; note?: string },
) {
  const db = await initializeLocalDatabase();
  const existing = await db.getFirstAsync<{ status: ChecklistItemStatus; note: string | null }>(
    'SELECT status, note FROM checklist_records WHERE id = ?',
    id,
  );
  if (!existing) throw new Error('Checklist record not found.');
  await db.runAsync(
    `UPDATE checklist_records SET status = ?, note = ?, updated_at = ? WHERE id = ?`,
    [changes.status ?? existing.status, changes.note ?? existing.note ?? null, new Date().toISOString(), id],
  );
}

export async function createChecklistItem(stageId: string, title: string, description?: string) {
  const db = await initializeLocalDatabase();
  const template = await getActiveTemplateForStage(stageId);
  if (!template) throw new Error('Checklist template not found.');
  const maxOrder = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(order_index) AS max_order FROM checklist_items WHERE template_id = ?',
    template.id,
  );
  const now = new Date().toISOString();
  const id = createLocalId('check-item');
  const order = (maxOrder?.max_order ?? 0) + 1;
  await db.runAsync(
    `INSERT INTO checklist_items
      (id, template_id, title, description, label, order_index, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, template.id, title, description ?? null, title, order, 1, now, now],
  );
  return listChecklistItemsForStage(stageId);
}

export async function updateChecklistItem(id: string, changes: { title: string; description?: string }) {
  const db = await initializeLocalDatabase();
  await db.runAsync(
    `UPDATE checklist_items
     SET title = ?, label = ?, description = ?, updated_at = ?
     WHERE id = ?`,
    [changes.title, changes.title, changes.description ?? null, new Date().toISOString(), id],
  );
}

export async function deactivateChecklistItem(id: string) {
  const db = await initializeLocalDatabase();
  await db.runAsync(
    'UPDATE checklist_items SET is_active = 0, updated_at = ? WHERE id = ?',
    [new Date().toISOString(), id],
  );
}

export async function reorderChecklistItems(stageId: string, itemIds: string[]) {
  const db = await initializeLocalDatabase();
  await db.withTransactionAsync(async () => {
    for (const [index, id] of itemIds.entries()) {
      await db.runAsync(
        'UPDATE checklist_items SET order_index = ?, updated_at = ? WHERE id = ?',
        [index + 1, new Date().toISOString(), id],
      );
    }
  });
  return listChecklistItemsForStage(stageId);
}