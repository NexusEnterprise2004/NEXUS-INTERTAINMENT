const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Membuat Postingan Baru (Support Gambar 📷)
const createPost = async (req, res) => {
  try {
    const { userId, content } = req.body;
    
    let imageUrl = '';
    if (req.file) {
      imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    if (!content && !imageUrl) {
      return res.status(400).json({ message: 'Tulis sesuatu atau upload gambar!' });
    }

    const newPost = await Post.create({
      user: userId,
      content,
      image: imageUrl,
    });

    const fullPost = await Post.findById(newPost._id).populate('user', 'username avatar');

    res.status(201).json(fullPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mengambil Postingan (Bisa Semua, Bisa per User 🧠)
const getPosts = async (req, res) => {
  try {
    const { userId } = req.query; // Cek apakah ada filter userId?

    let posts;
    if (userId) {
      // Ambil punya user tertentu
      posts = await Post.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('user', 'username avatar')
        .populate('comments.user', 'username avatar');
    } else {
      // Ambil semua (Feed Utama)
      posts = await Post.find()
        .sort({ createdAt: -1 })
        .populate('user', 'username avatar')
        .populate('comments.user', 'username avatar');
    }

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like / Unlike Postingan
const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    if (!post) return res.status(404).send('Postingan tidak ditemukan');

    const index = post.likes.findIndex((uid) => String(uid) === String(userId));

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes = post.likes.filter((uid) => String(uid) !== String(userId));
    }

    const updatedPost = await Post.findByIdAndUpdate(id, post, { new: true })
      .populate('user', 'username avatar')
      .populate('comments.user', 'username avatar');

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Menambah Komentar
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).send('Postingan tidak ditemukan');

    const comment = { user: userId, text };
    post.comments.push(comment);

    await post.save();

    const updatedPost = await Post.findById(id)
      .populate('user', 'username avatar')
      .populate('comments.user', 'username avatar');

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    HAPUS POSTINGAN 🗑️
const deletePost = async (req, res) => {
  try {
    const { id } = req.params; 
    const { userId } = req.body; 

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post tidak ditemukan' });

    if (post.user.toString() !== userId) {
      return res.status(401).json({ message: 'Dilarang menghapus postingan orang lain!' });
    }

    await Post.findByIdAndDelete(id); 
    res.json({ message: 'Postingan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PENTING: Export SEMUA 5 fungsi ini!
module.exports = { createPost, getPosts, likePost, addComment, deletePost };