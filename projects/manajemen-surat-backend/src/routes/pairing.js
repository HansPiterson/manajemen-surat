import crypto from 'crypto';
import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import {
  authenticate,
  requireDivisi,
  requireKurir,
} from '../middleware/auth.js';

const router = express.Router();
const TOKEN_TTL_MINUTES = 5;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function getDivisiPairing(userId) {
  const result = await pool.query(
    `SELECT tu.id,
            tu.nama_lengkap,
            tu.email,
            d.id AS divisi_id,
            d.kode AS divisi_kode,
            d.nama AS divisi_nama,
            k.id AS kurir_id,
            k.nama_lengkap AS kurir_nama,
            k.email AS kurir_email,
            k.status AS kurir_status
     FROM users tu
     LEFT JOIN divisi d ON d.id = tu.divisi_id
     LEFT JOIN users k ON k.id = tu.assigned_kurir_id
     WHERE tu.id = $1 AND tu.role = 'divisi'`,
    [userId]
  );

  return result.rows[0] ?? null;
}

async function getKurirPairing(userId) {
  const result = await pool.query(
    `SELECT k.id AS kurir_id,
            k.nama_lengkap AS kurir_nama,
            k.email AS kurir_email,
            tu.id,
            tu.nama_lengkap,
            tu.email,
            d.id AS divisi_id,
            d.kode AS divisi_kode,
            d.nama AS divisi_nama
     FROM users k
     LEFT JOIN users tu
       ON tu.assigned_kurir_id = k.id
      AND tu.role = 'divisi'
     LEFT JOIN divisi d ON d.id = tu.divisi_id
     WHERE k.id = $1 AND k.role = 'kurir'`,
    [userId]
  );

  return result.rows[0] ?? null;
}

function formatPairing(row) {
  if (!row) return { connected: false, tu: null, courier: null };

  return {
    connected: Boolean(row.id && row.kurir_id),
    tu: row.id
      ? {
          id: row.id,
          nama_lengkap: row.nama_lengkap,
          email: row.email,
          divisi_id: row.divisi_id,
          divisi_kode: row.divisi_kode,
          divisi_nama: row.divisi_nama,
        }
      : null,
    courier: row.kurir_id
      ? {
          id: row.kurir_id,
          nama_lengkap: row.kurir_nama,
          email: row.kurir_email,
          status: row.kurir_status ?? 'approved',
        }
      : null,
  };
}

router.get('/status', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'divisi') {
      return res.json(formatPairing(await getDivisiPairing(req.user.id)));
    }

    if (req.user.role === 'kurir') {
      return res.json(formatPairing(await getKurirPairing(req.user.id)));
    }

    return res.status(403).json({ error: 'Pairing is only available for divisi and kurir users' });
  } catch (error) {
    console.error('Get pairing status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/token', authenticate, requireDivisi, async (req, res) => {
  const client = await pool.connect();

  try {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);

    await client.query('BEGIN');
    await client.query(
      `SELECT id
       FROM users
       WHERE id = $1 AND role = 'divisi'
       FOR UPDATE`,
      [req.user.id]
    );
    await client.query(
      `DELETE FROM courier_pairing_tokens
       WHERE divisi_user_id = $1
         AND claimed_at IS NULL`,
      [req.user.id]
    );
    await client.query(
      `DELETE FROM courier_pairing_tokens
       WHERE expires_at < NOW() - INTERVAL '1 day'`
    );

    const result = await client.query(
      `INSERT INTO courier_pairing_tokens
       (divisi_user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))
       RETURNING id, expires_at`,
      [req.user.id, tokenHash, TOKEN_TTL_MINUTES]
    );
    await client.query('COMMIT');

    return res.status(201).json({
      pairing_url: `ekspedisi-surat://pair?token=${rawToken}`,
      expires_at: result.rows[0].expires_at,
      expires_in_seconds: TOKEN_TTL_MINUTES * 60,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create pairing token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post(
  '/claim',
  authenticate,
  requireKurir,
  body('token').isString().isLength({ min: 20, max: 200 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid pairing token' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const tokenResult = await client.query(
        `SELECT pt.id, pt.divisi_user_id
         FROM courier_pairing_tokens pt
         JOIN users tu ON tu.id = pt.divisi_user_id
         WHERE pt.token_hash = $1
           AND pt.claimed_at IS NULL
           AND pt.expires_at > NOW()
           AND tu.role = 'divisi'
         FOR UPDATE OF pt`,
        [hashToken(req.body.token)]
      );

      if (tokenResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'QR pairing is invalid, expired, or already used' });
      }

      const token = tokenResult.rows[0];

      const courierResult = await client.query(
        `SELECT id
         FROM users
         WHERE id = $1
           AND role = 'kurir'
           AND status = 'approved'
         FOR UPDATE`,
        [req.user.id]
      );
      if (courierResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Courier account is not approved' });
      }

      await client.query(
        `UPDATE users
         SET assigned_kurir_id = NULL,
             updated_at = NOW()
         WHERE role = 'divisi'
           AND assigned_kurir_id = $1
           AND id <> $2`,
        [req.user.id, token.divisi_user_id]
      );

      await client.query(
        `UPDATE users
         SET assigned_kurir_id = $1,
             updated_at = NOW()
         WHERE id = $2 AND role = 'divisi'`,
        [req.user.id, token.divisi_user_id]
      );

      await client.query(
        `UPDATE courier_pairing_tokens
         SET claimed_at = NOW(),
             claimed_by = $1
         WHERE id = $2`,
        [req.user.id, token.id]
      );

      await client.query('COMMIT');

      const pairing = formatPairing(await getKurirPairing(req.user.id));
      return res.json({
        message: 'Kurir berhasil terhubung dengan Tata Usaha',
        ...pairing,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Claim pairing token error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

router.delete('/connection', authenticate, requireDivisi, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users
       SET assigned_kurir_id = NULL,
           updated_at = NOW()
       WHERE id = $1 AND role = 'divisi'
       RETURNING id`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Divisi user not found' });
    }

    await pool.query(
      `DELETE FROM courier_pairing_tokens
       WHERE divisi_user_id = $1
         AND claimed_at IS NULL`,
      [req.user.id]
    );

    return res.json({
      message: 'Koneksi kurir berhasil diputus',
      connected: false,
      tu: null,
      courier: null,
    });
  } catch (error) {
    console.error('Disconnect pairing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
