const pool = require('../config/database');

class Product {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.brand = data.brand;
    this.cpu = data.cpu;
    this.ram = data.ram;
    this.storage = data.storage;
    this.screen = data.screen;
    this.price = data.price;
    this.original_price = data.original_price;
    this.discount = data.discount;
    this.image = data.image;
    this.rating = data.rating;
    this.reviews = data.reviews;
    this.created_at = data.created_at;
  }

  static async read() {
    try {
      const query = 'SELECT * FROM products ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows.map(row => new Product(row));
    } catch (error) {
      throw error;
    }
  }

  static async search(filters = {}) {
    try {
      const { keyword, brands, cpu, ram, minPrice, maxPrice } = filters;
      let query = 'SELECT * FROM products WHERE 1=1';
      const values = [];
      let paramIndex = 1;

      if (keyword) {
        query += ` AND name ILIKE $${paramIndex}`;
        values.push(`%${keyword}%`);
        paramIndex++;
      }

      if (brands && brands.length > 0) {
        const placeholders = brands.map(() => `$${paramIndex++}`).join(',');
        query += ` AND brand IN (${placeholders})`;
        values.push(...brands);
      }

      if (cpu) {
        query += ` AND cpu ILIKE $${paramIndex}`;
        values.push(`%${cpu}%`);
        paramIndex++;
      }

      if (ram) {
        query += ` AND ram ILIKE $${paramIndex}`;
        values.push(`%${ram}%`);
        paramIndex++;
      }

      if (minPrice) {
        query += ` AND price >= $${paramIndex}`;
        values.push(minPrice);
        paramIndex++;
      }

      if (maxPrice) {
        query += ` AND price <= $${paramIndex}`;
        values.push(maxPrice);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, values);
      return result.rows.map(row => new Product(row));
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM products WHERE id = $1';
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return null;
      return new Product(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async save() {
    try {
      const query = `
        INSERT INTO products (name, brand, cpu, ram, storage, screen, price, original_price, discount, image, rating, reviews)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const values = [
        this.name, this.brand, this.cpu, this.ram, this.storage, this.screen,
        this.price, this.original_price, this.discount, this.image, this.rating, this.reviews
      ];
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
        UPDATE products SET
          name = $1, brand = $2, cpu = $3, ram = $4, storage = $5, screen = $6,
          price = $7, original_price = $8, discount = $9, image = $10, rating = $11, reviews = $12
        WHERE id = $13
        RETURNING *
      `;
      const values = [
        this.name, this.brand, this.cpu, this.ram, this.storage, this.screen,
        this.price, this.original_price, this.discount, this.image, this.rating, this.reviews, this.id
      ];
      const result = await pool.query(query, values);
      return new Product(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Product;