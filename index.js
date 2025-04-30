const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const { storage } = require('./cloudinaryConfig'); // ✅ storage nga config
const sequelize = require('./db');
const User = require('./models/User');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS për frontendin në Vercel
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || /^https:\/\/merrbio-frontend.*\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true,
};
app.use(cors(corsOptions));

// ✅ Middleware
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Konfigurimi i multer me Cloudinary
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (extname && mimeType) return cb(null, true);
    cb('Only image files can be uploaded!');
  }
});

// ✅ Sinkronizimi i databazës
sequelize.sync().then(() => {
  console.log('📦 Databaza u sinkronizua me sukses!');
});

// ================= ROUTES =================

// 🔐 Regjistrimi
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const existing = await User.findOne({ where: { username: username.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists!' });
    }

    const user = await User.create({
      username: username.trim(),
      password: password.trim(),
      role: role.toLowerCase()
    });

    res.json({ message: 'Registration successful!', username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Error during registration', error: err.message });
  }
});

// 🔐 Login
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await User.findOne({
      where: {
        username: username.trim(),
        password: password.trim()
      }
    });

    if (!user) return res.status(401).json({ message: 'Kredencialet janë të pasakta!' });
    if (user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(401).json({ message: 'Roli nuk përputhet me kredencialet!' });
    }

    res.json({ message: 'Hyrja u krye me sukses!', role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë hyrjes', error: err.message });
  }
});

// 🧺 Shto produkt
app.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { emri, pershkrimi, cmimi, fermeri } = req.body;
    const imageUrl = req.file ? req.file.path : '';

    const newProduct = await Product.create({
      emri,
      pershkrimi,
      cmimi,
      fermeri,
      image: imageUrl,
    });

    res.json({ message: 'Produkti u shtua me sukses!', product: newProduct });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë shtimit të produktit', error: err.message });
  }
});
// 📦 Merr të gjithë produktet
app.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë marrjes së produkteve', error: err.message });
  }
});


// 🔄 Përditëso produkt
app.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id;
    const { emri, pershkrimi, cmimi } = req.body;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: 'Produkti nuk u gjet!' });

    let imageUrl = product.image;
    if (req.file) imageUrl = req.file.path;

    await product.update({
      emri: emri || product.emri,
      pershkrimi: pershkrimi || product.pershkrimi,
      cmimi: cmimi || product.cmimi,
      image: imageUrl
    });

    res.json({ message: 'Produkti u përditësua me sukses!', product });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë përditësimit të produktit', error: err.message });
  }
});

// 🗑️ Fshi produkt
app.delete('/products/:id', async (req, res) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    if (deleted) res.json({ message: 'Produkti u fshi me sukses!' });
    else res.status(404).json({ message: 'Produkti nuk u gjet!' });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë fshirjes së produktit', error: err.message });
  }
});

// 👥 Merr të gjithë përdoruesit
app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë marrjes së përdoruesve', error: err.message });
  }
});

// 👤 Shto përdorues
app.post('/users', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const existing = await User.findOne({ where: { username: username.trim() } });
    if (existing) return res.status(400).json({ message: 'Përdoruesi ekziston!' });

    const user = await User.create({ username, password, role });
    res.json({ message: 'Përdoruesi u shtua me sukses!', user });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë shtimit', error: err.message });
  }
});

// ❌ Fshi përdorues
app.delete('/users/:username', async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { username: req.params.username } });
    if (deleted) res.json({ message: 'Përdoruesi u fshi me sukses!' });
    else res.status(404).json({ message: 'Përdoruesi nuk u gjet!' });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë fshirjes', error: err.message });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 MerrBio backend running on http://localhost:${PORT}`);
});
