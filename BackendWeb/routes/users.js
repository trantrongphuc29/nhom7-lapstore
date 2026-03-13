const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users - Lấy tất cả users
router.get('/', async (req, res) => {
  try {
    const users = await User.read();
    
    // Chỉ trả về id và name
    const simplifiedUsers = users.map(user => ({
      id: user.id,
      name: user.name
    }));
    
    res.json({
      records: simplifiedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// GET /api/users/:id - Lấy user theo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Chỉ trả về id và name
    res.json({
      id: user.id,
      name: user.name
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// POST /api/users - Tạo user mới
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    const user = new User({ name, email, password, role });
    const savedUser = await user.save();
    
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// PUT /api/users/:id - Cập nhật user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    Object.assign(user, req.body);
    const updatedUser = await user.update();
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// DELETE /api/users/:id - Xóa user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;