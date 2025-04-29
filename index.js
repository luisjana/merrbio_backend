const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

const sequelize = require('./db');
const User = require('./models/User');

sequelize.sync().then(() => {
  console.log('📦 Databaza u sinkronizua me sukses!');
});

// ✅ CORS për frontendin në Vercel
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || /^https:\/\/merrbio-frontend.*\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));

// ✅ Middleware
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// ✅ Konfigurimi për imazhe
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

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

// ✅ JSON file utils
const readData = (file) => {
  try {
    return JSON.parse(fs.readFileSync(`./data/${file}`, 'utf8'));
  } catch (err) {
    console.error(`Error reading ${file}: `, err);
    return [];
  }
};

const writeData = (file, data) => {
  fs.writeFileSync(`./data/${file}`, JSON.stringify(data, null, 2));
};

// ============== ROUTES ==============

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

    if (!user) {
      return res.status(401).json({ message: 'Kredencialet janë të pasakta!' });
    }

    if (user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(401).json({ message: 'Roli i zgjedhur nuk përputhet me kredencialet!' });
    }

    res.json({
      message: 'Hyrja u krye me sukses!',
      role: user.role,
      username: user.username
    });

  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë hyrjes', error: err.message });
  }
});

// 🧺 Shto produkt
app.post('/products', upload.single('image'), (req, res) => {
  const products = readData('products.json');
  const { emri, pershkrimi, cmimi, fermeri } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  const product = { emri, pershkrimi, cmimi, fermeri, image: imageUrl };
  products.push(product);
  writeData('products.json', products);
  res.json({ message: 'Product added successfully!' });
});

// 🔍 Merr përdorues nga JSON
app.get('/users', (req, res) => {
  const users = readData('users.json');
  res.json(users);
});

// ❌ Fshi përdorues nga JSON
app.delete('/users/:username', (req, res) => {
  let users = readData('users.json');
  users = users.filter(u => u.username !== req.params.username);
  writeData('users.json', users);
  res.json({ message: 'User deleted successfully!' });
});

// 🔍 Merr produktet
app.get('/products', (req, res) => {
  try {
    const products = readData('products.json');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error loading products' });
  }
});

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`MerrBio backend running on http://localhost:${PORT}`);
});
