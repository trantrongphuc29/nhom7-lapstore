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
    try {
      const query = 'SELECT * FROM users ORDER BY id ASC';
      const result = await pool.query(query);
      return result.rows.map(row => new User(row));
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return null;
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      if (result.rows.length === 0) return null;
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async save() {
    try {
      const query = `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [this.name, this.email, this.password, this.role];
      const result = await pool.query(query, values);
      this.id = result.rows[0].id;
      this.created_at = result.rows[0].created_at;
      return this;
    } catch (error) {
      throw error;
    }
  }

  async update() {
    try {
      const query = `
        UPDATE users SET
          name = $1, email = $2, password = $3, role = $4
        WHERE id = $5
        RETURNING *
      `;
      const values = [this.name, this.email, this.password, this.role, this.id];
      const result = await pool.query(query, values);
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;