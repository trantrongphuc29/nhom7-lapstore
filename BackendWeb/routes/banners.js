const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// GET /api/banners - Lấy tất cả banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.read();
    
    res.json({
      records: banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ message: 'Error fetching banners' });
  }
});

// GET /api/banners/:id - Lấy banner theo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    res.json(banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ message: 'Error fetching banner' });
  }
});

// POST /api/banners - Tạo banner mới
router.post('/', async (req, res) => {
  try {
    const bannerData = req.body;
    const banner = new Banner(bannerData);
    const savedBanner = await banner.save();
    
    res.status(201).json(savedBanner);
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ message: 'Error creating banner' });
  }
});

// PUT /api/banners/:id - Cập nhật banner
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    Object.assign(banner, req.body);
    const updatedBanner = await banner.update();
    
    res.json(updatedBanner);
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ message: 'Error updating banner' });
  }
});

// DELETE /api/banners/:id - Xóa banner
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Banner.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ message: 'Error deleting banner' });
  }
});

module.exports = router;