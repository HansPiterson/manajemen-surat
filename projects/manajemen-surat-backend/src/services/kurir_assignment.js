import pool from '../db/pool.js';

export async function findAssignedKurirId(divisiId) {
  if (!divisiId) return null;

  const result = await pool.query(
    `SELECT tu.assigned_kurir_id
     FROM users tu
     JOIN users k ON k.id = tu.assigned_kurir_id
     WHERE tu.role = 'divisi'
       AND tu.divisi_id = $1
       AND tu.assigned_kurir_id IS NOT NULL
       AND k.role = 'kurir'
       AND k.status = 'approved'
     ORDER BY tu.updated_at DESC NULLS LAST, tu.created_at ASC
     LIMIT 1`,
    [divisiId]
  );

  return result.rows[0]?.assigned_kurir_id ?? null;
}

export async function isKurirAssignedToDivision(kurirId, divisiId) {
  if (!kurirId || !divisiId) return false;

  const result = await pool.query(
    `SELECT EXISTS (
       SELECT 1
       FROM users tu
       JOIN users k ON k.id = tu.assigned_kurir_id
       WHERE tu.role = 'divisi'
         AND tu.divisi_id = $1
         AND tu.assigned_kurir_id = $2
         AND k.role = 'kurir'
         AND k.status = 'approved'
     ) AS assigned`,
    [divisiId, kurirId]
  );

  return result.rows[0]?.assigned === true;
}
