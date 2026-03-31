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
    const [rows] = await pool.query('SELECT * FROM banners WHERE is_active = 1 ORDER BY id ASC');
    return rows.map(row => new Banner(row));
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return new Banner(rows[0]);
  }

  async save() {
    const [result] = await pool.query(
      'INSERT INTO banners (title, image, link, is_active) VALUES (?, ?, ?, ?)',
      [this.title, this.image, this.link, this.is_active]
    );
    this.id = result.insertId;
    return this;
  }

  async update() {
    await pool.query(
      'UPDATE banners SET title=?, image=?, link=?, is_active=? WHERE id=?',
      [this.title, this.image, this.link, this.is_active, this.id]
    );
    return this;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM banners WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Banner;
