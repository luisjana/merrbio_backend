const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// CORS me frontend-in tënd
const corsOptions = {
  origin: [
    'https://merrbio-frontend-ed844fimd-luisjanas-projects.vercel.app',
    'https://merrbio-frontend-hzx3elswb-luisjanas-projects.vercel.app',
    'https://merrbio-frontend.vercel.app',
  ],
  methods: ['GET', 'POST', 'DELETE'],
};

app.use(cors(corsOptions));

// Middleware për JSON dhe form data
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Krijo folderin uploads nëse nuk ekziston
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Konfigurimi për ngarkimin e imazheve
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

// Leximi dhe shkrimi në file JSON
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

// ================= ROUTES =================

// 🔐 Regjistrimi
app.post('/register', (req, res) => {
  const users = readData('users.json');
  const { username, password, role } = req.body;

  console.log('Kërkesë për /register:', req.body);

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User already exists!' });
  }

  users.push({ username, password, role });
  writeData('users.json', users);
  res.json({ message: 'Registration successful!', role, username });
});

// 🔐 Login
app.post('/login', (req, res) => {
  const users = readData('users.json');
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials!' });

  res.json({ message: 'Login successful!', role: user.role, username: user.username });
});

// 🧺 Shto produkt me foto
app.post('/products', upload.single('image'), (req, res) => {
  const products = readData('products.json');
  const { emri, pershkrimi, cmimi, fermeri } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  const product = { emri, pershkrimi, cmimi, fermeri, image: imageUrl };
  products.push(product);
  writeData('products.json', products);
  res.json({ message: 'Product added successfully!' });
});

// 🔍 Merr të gjithë përdoruesit
app.get('/users', (req, res) => {
  const users = readData('users.json');
  res.json(users);
});

// ❌ Fshi përdorues sipas username
app.delete('/users/:username', (req, res) => {
  let users = readData('users.json');
  users = users.filter(u => u.username !== req.params.username);
  writeData('users.json', users);
  res.json({ message: 'User deleted successfully!' });
});

// 🔍 Merr të gjitha produktet
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