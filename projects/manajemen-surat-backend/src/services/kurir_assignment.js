import pool from '../db/pool.js';

export async function findAssignedKurirIdForCreator(createdByUserId) {
  if (!createdByUserId) return null;

  const result = await pool.query(
    `SELECT tu.assigned_kurir_id
     FROM users tu
     JOIN users k ON k.id = tu.assigned_kurir_id
     WHERE tu.role = 'divisi'
       AND tu.id = $1
       AND tu.assigned_kurir_id IS NOT NULL
       AND k.role = 'kurir'
       AND k.status = 'approved'
     LIMIT 1`,
    [createdByUserId]
  );

  return result.rows[0]?.assigned_kurir_id ?? null;
}

export async function isKurirAssignedToCreator(kurirId, createdByUserId) {
  if (!kurirId || !createdByUserId) return false;

  const result = await pool.query(
    `SELECT EXISTS (
       SELECT 1
       FROM users tu
       JOIN users k ON k.id = tu.assigned_kurir_id
       WHERE tu.role = 'divisi'
         AND tu.id = $1
         AND tu.assigned_kurir_id = $2
         AND k.role = 'kurir'
         AND k.status = 'approved'
     ) AS assigned`,
    [createdByUserId, kurirId]
  );

  return result.rows[0]?.assigned === true;
}

export async function isApprovedKurir(kurirId) {
  if (!kurirId) return false;

  const result = await pool.query(
    `SELECT EXISTS (
       SELECT 1
       FROM users
       WHERE id = $1
         AND role = 'kurir'
         AND status = 'approved'
     ) AS approved`,
    [kurirId]
  );

  return result.rows[0]?.approved === true;
}

export async function canKurirAccessSurat(kurirId, surat) {
  if (!kurirId || !surat) return false;
  if (surat.kurir_id === kurirId) return true;

  if (surat.status !== 'draft' || surat.kurir_id || !surat.created_by) {
    return false;
  }

  return isKurirAssignedToCreator(kurirId, surat.created_by);
}
