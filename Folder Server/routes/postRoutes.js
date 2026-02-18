const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createPost, getPosts, likePost, addComment, deletePost } = require('../controllers/postController');

// --- KONFIGURASI UPLOAD ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --- ROUTES ---
router.route('/')
  .get(getPosts)
  .post(upload.single('image'), createPost);

router.put('/:id/like', likePost);
router.post('/:id/comment', addComment);

// JALUR HAPUS (DELETE) 🗑️
router.delete('/:id', deletePost);

module.exports = router;