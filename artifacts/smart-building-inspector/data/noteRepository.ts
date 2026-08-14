import { z } from 'zod';
import { initializeLocalDatabase } from '@/data/localDatabase';
import { Note, NoteType, SyncStatus, createLocalId } from '@/types/inspection';

const noteRowSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  visit_id: z.string(),
  type: z.enum(['TEXT', 'VOICE']),
  text: z.string(),
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  sync_status: z.enum(['LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'ERROR']),
});

function toNote(row: z.infer<typeof noteRowSchema>): Note {
  return {
    id: row.id,
    projectId: row.project_id,
    visitId: row.visit_id,
    type: row.type,
    text: row.text || row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

export async function listNotesForVisit(visitId: string) {
  const db = await initializeLocalDatabase();
  const rows = await db.getAllAsync<z.infer<typeof noteRowSchema>>(
    `SELECT * FROM notes WHERE visit_id = ? ORDER BY created_at DESC`,
    visitId,
  );
  return rows.flatMap((row) => {
    const parsed = noteRowSchema.safeParse(row);
    return parsed.success ? [toNote(parsed.data)] : [];
  });
}

export async function createTextNote(projectId: string, visitId: string, text: string) {
  const db = await initializeLocalDatabase();
  const now = new Date().toISOString();
  const note: Note = {
    id: createLocalId('note'),
    projectId,
    visitId,
    type: 'TEXT',
    text,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'LOCAL',
  };
  await db.runAsync(
    `INSERT INTO notes
      (id, project_id, visit_id, type, text, body, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [note.id, note.projectId, note.visitId, note.type, note.text, note.text, now, now, note.syncStatus],
  );
  return note;
}

export async function updateNote(id: string, text: string) {
  const db = await initializeLocalDatabase();
  await db.runAsync(
    `UPDATE notes SET type = ?, text = ?, body = ?, updated_at = ?, sync_status = ? WHERE id = ?`,
    ['TEXT' satisfies NoteType, text, text, new Date().toISOString(), 'PENDING' satisfies SyncStatus, id],
  );
}

export async function deleteNote(id: string) {
  const db = await initializeLocalDatabase();
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}