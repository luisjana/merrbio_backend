const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001; // Përdorimi i portit të mjedisit ose 3001 si fallback

// Enable CORS and JSON parsing
app.use(cors());  // Përdorimi i CORS në nivel global
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));  // Për përdorimin e ngarkimeve të imazheve

// Kontrolloni nëse ka krijuar folderin për upload
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Konfigurimi i Multer për ngarkimin e imazheve
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maksimumi 10MB për çdo file
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (extname && mimeType) {
      return cb(null, true);
    } else {
      cb('Only image files can be uploaded!');
    }
  }
});

// Funksione për të lexuar dhe shkruar në skedarët JSON
const readData = (file) => {
  try {
    return JSON.parse(fs.readFileSync(`./data/${file}`, 'utf8'));
  } catch (err) {
    console.error(`Error reading ${file}: `, err);
    return [];  // Ktheni një listë të zbrazët nëse ka gabim
  }
};

const writeData = (file, data) => fs.writeFileSync(`./data/${file}`, JSON.stringify(data, null, 2));

// Route për regjistrim (POST)
app.post('/register', (req, res) => {
  const users = readData('users.json');
  const { username, password, role } = req.body;

  // Kontrolloni nëse përdoruesi ekziston
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User already exists!' });
  }

  // Shto përdoruesin e ri
  users.push({ username, password, role });
  writeData('users.json', users);
  res.json({ message: 'Registration successful!' });
});

// Route për login (POST)
app.post('/login', (req, res) => {
  const users = readData('users.json');
  const { username, password } = req.body;

  // Kërko përdoruesin nëse ekziston
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials!' });

  res.json({ message: 'Login successful!', role: user.role, username: user.username });
});

// Route për ngarkimin e një produkti (POST)
app.post('/products', upload.single('image'), (req, res) => {
  const products = readData('products.json');
  const { emri, pershkrimi, cmimi, fermeri } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';  // URL për imazhin

  const product = { emri, pershkrimi, cmimi, fermeri, image: imageUrl };
  products.push(product);
  writeData('products.json', products);
  res.json({ message: 'Product added successfully!' });
});

// Route për marrjen e të gjithë përdoruesve (GET)
app.get('/users', (req, res) => {
  const users = readData('users.json');
  res.json(users);
});

// Route për fshirjen e përdoruesit (DELETE)
app.delete('/users/:username', (req, res) => {
  let users = readData('users.json');
  users = users.filter(u => u.username !== req.params.username);
  writeData('users.json', users);
  res.json({ message: 'User deleted successfully!' });
});

// Route për marrjen e të gjitha produkteve (GET)
app.get('/products', (req, res) => {
  try {
    const products = readData('products.json');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error loading products' });
  }
});

// Starting the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const corsOptions = {
  origin: 'https://merrbio-frontend-e2q1s714i-luisjanas-projects.vercel.app',  // URL frontend
  methods: ['GET', 'POST'],
};
app.use(cors(corsOptions));  // Përdorimi i CORS
