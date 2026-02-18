const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
  {
    // 1. Relasi ke User (PENTING: Agar tahu siapa yang posting)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Menyambung ke model User.js
    },
    // 2. Isi Postingan
    content: {
      type: String,
      required: [true, 'Isi postingan tidak boleh kosong'],
      trim: true, // Otomatis hapus spasi berlebih di awal/akhir
    },
    // 3. Gambar/Video (Opsional)
    image: {
      type: String,
      default: '', // Kalau tidak ada gambar, kosongkan saja
    },
    // 4. Sistem Likes (Menyimpan ID user yang nge-like)
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // 5. Sistem Komentar (Array of Objects)
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // Otomatis buat 'createdAt' dan 'updatedAt'
  }
);

module.exports = mongoose.model('Post', postSchema);