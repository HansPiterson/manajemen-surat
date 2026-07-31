import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all divisi (public access for login dropdown)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nama, kode, is_active FROM divisi WHERE is_active = true ORDER BY nama'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get divisi error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single divisi
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM divisi WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Divisi not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get divisi error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create divisi (admin only)
router.post('/',
  authenticate,
  requireAdmin,
  body('nama').notEmpty().trim(),
  body('kode').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nama, kode } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO divisi (nama, kode, is_active)
         VALUES ($1, $2, true)
         RETURNING *`,
        [nama, kode || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // unique violation
        return res.status(400).json({ error: 'Divisi name or code already exists' });
      }
      console.error('Create divisi error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update divisi (admin only)
router.put('/:id',
  authenticate,
  requireAdmin,
  body('nama').optional().trim(),
  body('kode').optional().trim(),
  body('is_active').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nama, kode, is_active } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nama !== undefined) {
      updates.push(`nama = $${paramIndex++}`);
      values.push(nama);
    }
    if (kode !== undefined) {
      updates.push(`kode = $${paramIndex++}`);
      values.push(kode);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    try {
      const result = await pool.query(
        `UPDATE divisi SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Divisi not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Divisi name or code already exists' });
      }
      console.error('Update divisi error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete divisi (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM divisi WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Divisi not found' });
    }

    res.json({ message: 'Divisi deleted successfully' });
  } catch (error) {
    if (error.code === '23503') { // foreign key violation
      return res.status(400).json({ error: 'Cannot delete divisi with associated data' });
    }
    console.error('Delete divisi error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
