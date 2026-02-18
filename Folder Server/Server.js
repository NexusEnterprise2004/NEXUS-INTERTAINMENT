const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path'); // Tambahan: Modul untuk mengatur jalur folder

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// --- UPDATE PENTING: JADIKAN FOLDER UPLOADS PUBLIK ---
// Artinya: Siapapun bisa membuka link http://localhost:5000/uploads/namafoto.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:5000`));