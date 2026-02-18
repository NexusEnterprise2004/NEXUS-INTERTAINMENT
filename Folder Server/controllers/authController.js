const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Fungsi bikin Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register User Baru
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Mohon lengkapi semua data' });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email sudah terdaftar' });

    const user = await User.create({ username, email, password });

    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Data user tidak valid' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login User
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Username atau password salah' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Foto Profil
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Silakan upload foto dulu' });
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { avatar: avatarUrl },
      { new: true } 
    ).select('-password'); 

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cari User (SEARCH) 🔍
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query; 
    const users = await User.find({ 
      username: { $regex: q, $options: 'i' } 
    }).select('username avatar _id'); 

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PENTING: Pastikan ada 4 fungsi di sini!
module.exports = { registerUser, loginUser, updateAvatar, searchUsers };