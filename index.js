const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = 3001;

// Enable CORS and JSON parsing
app.use(cors());  // Përdorimi i CORS në nivel global
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));  // For image upload path

// Create uploads directory if not exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Multer configuration for image upload
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

// Functions to read and write data in JSON files
const readData = (file) => JSON.parse(fs.readFileSync(`./data/${file}`, 'utf8'));
const writeData = (file, data) => fs.writeFileSync(`./data/${file}`, JSON.stringify(data, null, 2));

// User registration
app.post('/register', (req, res) => {
  const users = readData('users.json');
  const { username, password, role } = req.body;

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User already exists!' });
  }

  users.push({ username, password, role });
  writeData('users.json', users);
  res.json({ message: 'Registration successful!' });
});

// Login
app.post('/login', (req, res) => {
  const users = readData('users.json');
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials!' });

  res.json({ message: 'Login successful!', role: user.role, username: user.username });
});

// Adding a product
app.post('/products', upload.single('image'), (req, res) => {
  const products = readData('products.json');
  const { emri, pershkrimi, cmimi, fermeri } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';  // Image URL

  const product = { emri, pershkrimi, cmimi, fermeri, image: imageUrl };
  products.push(product);
  writeData('products.json', products);
  res.json({ message: 'Product added successfully!' });
});

// Users Management

// Adding a user
app.post('/users', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Të gjitha fushat janë të detyrueshme!' });
  }

  const users = readData('users.json');
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Përdoruesi ekziston!' });
  }

  users.push({ username, password, role });
  writeData('users.json', users);
  res.json({ message: 'Përdoruesi u shtua me sukses!' });
});

// Getting all users
app.get('/users', (req, res) => {
  const users = readData('users.json');
  res.json(users);
});

  
// Deleting a user
app.delete('/users/:username', (req, res) => {
  let users = readData('users.json');
  users = users.filter(u => u.username !== req.params.username);
  writeData('users.json', users);
  res.json({ message: 'User deleted successfully!' });
});
app.get('/products', (req, res) => {
    try {
        const products = readData('products.json');
        console.log('Products loaded:', products); // Log products for debugging
        res.json(products);
    } catch (err) {
        console.error('Error reading products:', err);
        res.status(500).json({ message: 'Error loading products' });
    }
});
app.get('/requests', (req, res) => {
  // Handling the request and sending response
});

// Starting the server
app.listen(PORT, () => {
  console.log(`Serveri po punon në http://localhost:${PORT}`);
});
app.get('/requests', (req, res) => {
  const requests = readData('requests.json');
  res.json(requests);
});
const corsOptions = {
  origin: 'https://merrbio-frontend-e2q1s714i-luisjanas-projects.vercel.app/',  // Zëvendësoni me URL-në e frontend-it tuaj
  methods: ['GET', 'POST'],
};
app.use(cors(corsOptions));

