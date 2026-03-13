const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - Lấy tất cả products với filter
router.get('/', async (req, res) => {
  try {
    const { brand, cpu, ram, minPrice, maxPrice, keyword } = req.query;
    
    const filters = {};
    if (brand) filters.brands = brand.split(',');
    if (cpu) filters.cpu = cpu;
    if (ram) filters.ram = ram;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (keyword) filters.keyword = keyword;

    const products = await Product.search(filters);
    
    res.json({
      records: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// GET /api/products/:id - Lấy product theo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// POST /api/products - Tạo product mới
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    const product = new Product(productData);
    const savedProduct = await product.save();
    
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// PUT /api/products/:id - Cập nhật product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    Object.assign(product, req.body);
    const updatedProduct = await product.update();
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// DELETE /api/products/:id - Xóa product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router;