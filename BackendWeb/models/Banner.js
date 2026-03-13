const pool = require('../config/database');

class Banner {
  constructor(data = {}) {
    this.id = data.id;
    this.title = data.title;
    this.image = data.image;
    this.link = data.link;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
  }

  static async read() {
    try {
      const query = 'SELECT * FROM banners WHERE is_active = true ORDER BY id ASC';
      const result = await pool.query(query);
      return result.rows.map(row => new Banner(row));
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM banners WHERE id = $1';
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return null;
      return new Banner(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async save() {
    try {
      const query = `
        INSERT INTO banners (title, image, link, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [this.title, this.image, this.link, this.is_active];
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
        UPDATE banners SET
          title = $1, image = $2, link = $3, is_active = $4
        WHERE id = $5
        RETURNING *
      `;
      const values = [this.title, this.image, this.link, this.is_active, this.id];
      const result = await pool.query(query, values);
      return new Banner(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM banners WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Banner;