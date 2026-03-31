const pool = require('../config/database');

class User {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.created_at = data.created_at;
  }

  static async read() {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY id ASC');
    return rows.map(row => new User(row));
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  async save() {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [this.name, this.email, this.password, this.role || "user"]
    );
    this.id = result.insertId;
    return this;
  }

  async update() {
    await pool.query(
      'UPDATE users SET name=?, email=?, password=?, role=? WHERE id=?',
      [this.name, this.email, this.password, this.role || "user", this.id]
    );
    return this;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = User;
