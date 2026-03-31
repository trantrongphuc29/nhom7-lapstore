const pool = require('../config/database');

class AuthUser {
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id, email, NULL AS full_name, NULL AS phone, password, role, created_at FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, email, NULL AS full_name, NULL AS phone, password, role, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async findPublicById(id) {
    const [rows] = await pool.query(
      'SELECT id, email, NULL AS full_name, NULL AS phone, role, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async create({ email, passwordHash, role = "user" }) {
    const [result] = await pool.query(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, passwordHash, role]
    );

    const [rows] = await pool.query(
      'SELECT id, email, NULL AS full_name, NULL AS phone, role, created_at FROM users WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    return rows[0] || null;
  }

  static async updateProfile(id, { fullName, phone }) {
    const row = await this.findPublicById(id);
    if (!row) return null;
    const nextFull = fullName !== undefined ? String(fullName).trim() || null : null;
    const nextPhone = phone !== undefined ? String(phone).trim() || null : null;
    try {
      await pool.query(`UPDATE users SET full_name = ?, phone = ? WHERE id = ?`, [nextFull, nextPhone, id]);
    } catch (error) {
      if (error?.code !== "ER_BAD_FIELD_ERROR") throw error;
      // Schema tối giản không có full_name/phone: bỏ qua để không làm hỏng luồng auth.
    }
    return this.findPublicById(id);
  }

  static async updatePasswordHash(id, passwordHash) {
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [passwordHash, id]);
  }
}

module.exports = AuthUser;
