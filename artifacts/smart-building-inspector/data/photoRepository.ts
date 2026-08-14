import { z } from 'zod';
import { initializeLocalDatabase } from '@/data/localDatabase';
import { Photo, SyncStatus, createLocalId } from '@/types/inspection';

const photoRowSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  visit_id: z.string(),
  local_uri: z.string(),
  file_name: z.string(),
  captured_at: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  caption: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  sync_status: z.enum(['LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'ERROR']),
});

function toPhoto(row: z.infer<typeof photoRowSchema>): Photo {
  return {
    id: row.id,
    projectId: row.project_id,
    visitId: row.visit_id,
    localUri: row.local_uri,
    fileName: row.file_name,
    capturedAt: row.captured_at,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    caption: row.caption ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

export type PhotoInput = {
  projectId: string;
  visitId: string;
  localUri: string;
  fileName: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  caption?: string;
};

export async function listPhotosForVisit(visitId: string) {
  const db = await initializeLocalDatabase();
  const rows = await db.getAllAsync<z.infer<typeof photoRowSchema>>(
    'SELECT * FROM photos WHERE visit_id = ? ORDER BY captured_at DESC, created_at DESC',
    visitId,
  );
  return rows.flatMap((row) => {
    const parsed = photoRowSchema.safeParse(row);
    return parsed.success ? [toPhoto(parsed.data)] : [];
  });
}

export async function insertPhoto(input: PhotoInput) {
  const db = await initializeLocalDatabase();
  const now = new Date().toISOString();
  const photo: Photo = {
    id: createLocalId('photo'),
    ...input,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'LOCAL',
  };
  await db.runAsync(
    `INSERT INTO photos
      (id, project_id, visit_id, local_uri, file_name, captured_at, latitude,
       longitude, caption, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      photo.id,
      photo.projectId,
      photo.visitId,
      photo.localUri,
      photo.fileName,
      photo.capturedAt,
      photo.latitude ?? null,
      photo.longitude ?? null,
      photo.caption ?? null,
      photo.createdAt,
      photo.updatedAt,
      photo.syncStatus,
    ],
  );
  return photo;
}

export async function updatePhotoCaption(id: string, caption: string) {
  const db = await initializeLocalDatabase();
  await db.runAsync(
    `UPDATE photos SET caption = ?, updated_at = ?, sync_status = ? WHERE id = ?`,
    [caption, new Date().toISOString(), 'PENDING' satisfies SyncStatus, id],
  );
}

export async function deletePhoto(id: string) {
  const db = await initializeLocalDatabase();
  await db.runAsync('DELETE FROM photos WHERE id = ?', id);
}