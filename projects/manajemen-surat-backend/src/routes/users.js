import express from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.nama_lengkap, u.role, u.status, u.divisi_id, u.created_at,
              d.nama as divisi_nama
       FROM users u
       LEFT JOIN divisi d ON u.divisi_id = d.id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending kurir (admin only)
router.get('/pending-kurir', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, nama_lengkap, status, created_at
       FROM users
       WHERE role = 'kurir' AND status = 'pending'
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending kurir error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (admin only)
router.post('/',
  authenticate,
  requireAdmin,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nama_lengkap').notEmpty(),
  body('role').isIn(['admin', 'divisi', 'kurir']),
  body('divisi_id').optional({ nullable: true, checkFalsy: true }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, nama_lengkap, role, divisi_id } = req.body;

    try {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, nama_lengkap, role, divisi_id, status)
         VALUES ($1, $2, $3, $4, $5, 'approved')
         RETURNING id, email, nama_lengkap, role, divisi_id, status`,
        [email, password_hash, nama_lengkap, role, divisi_id || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update user (admin only)
router.put('/:id',
  authenticate,
  requireAdmin,
  body('status').optional().isIn(['pending', 'approved', 'nonaktif']),
  body('divisi_id').optional({ nullable: true, checkFalsy: true }),
  body('role').optional().isIn(['admin', 'divisi', 'kurir']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, divisi_id, role } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (divisi_id !== undefined) {
      updates.push(`divisi_id = $${paramIndex++}`);
      values.push(divisi_id);
    }

    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    try {
      const result = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} 
         RETURNING id, email, nama_lengkap, role, divisi_id, status`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// Save FCM device token for push notifications
router.post('/device-token', authenticate, async (req, res) => {
  try {
    const { token, platform = 'android' } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    await pool.query(
      `INSERT INTO device_tokens (user_id, token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, token) DO UPDATE SET platform = $3`,
      [req.user.id, token, platform]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Save device token error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete FCM device token on logout
router.delete('/device-token', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    await pool.query(
      'DELETE FROM device_tokens WHERE user_id = $1 AND token = $2',
      [req.user.id, token]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Delete device token error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
