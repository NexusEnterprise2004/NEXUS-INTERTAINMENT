const express = require('express');
const router = express.Router();

// Import 4 Fungsi dari Controller
const { registerUser, loginUser, updateAvatar, searchUsers } = require('../controllers/authController');

// Setup Multer
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware Protect
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) { res.status(401).json({ message: 'Token gagal' }); }
  }
  if (!token) res.status(401).json({ message: 'Tidak ada token' });
};

// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/search', searchUsers); // Jalur Search
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;