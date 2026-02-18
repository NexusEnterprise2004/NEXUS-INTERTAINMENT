const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username wajib diisi'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
  },
  avatar: {
    type: String,
    default: "https://via.placeholder.com/150",
  }
}, {
  timestamps: true // Fitur PRO: Otomatis nambah info tanggal dibuat & diedit
});

// Middleware: Enkripsi password otomatis sebelum disimpan
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method: Cek kecocokan password (dipakai saat Login nanti)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);