require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { storage } = require('./cloudinaryConfig');
const sequelize = require('./db');
const User = require('./models/User');
const productController = require('./controllers/productController');
const orderController = require('./controllers/orderController');
const authenticate = require('./middleware/authenticate');
const authorizeRole = require('./middleware/authorizeRole');
const handleError = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true,
}));

app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (extname && mimeType) return cb(null, true);
    cb(new Error('Vetëm skedarë imazhesh lejohen!'));
  },
});

// ✅ SINKRONIZO DB
sequelize.sync({ force: true }).then(() => console.log('📦 Database synced (force mode, tables recreated)!'));

// ✅ REGJISTRIM
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(400).json({ message: 'User already exists!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, role });
    res.json({ message: 'Registration successful!', username: user.username, role: user.role });
  } catch (err) {
    handleError(res, err, 'Error during registration');
  }
});

// ✅ LOGIN
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials!' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials!' });

    if (user.role !== role) return res.status(401).json({ message: 'Role mismatch!' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful!', token, username: user.username, role: user.role });
  } catch (err) {
    handleError(res, err, 'Error during login');
  }
});

// ✅ PRODUCT ROUTES
app.get('/products', productController.getAllProducts);
app.post('/products', authenticate, authorizeRole('fermer'), upload.single('image'), productController.createProduct);
app.put('/products/:id', authenticate, authorizeRole('fermer'), upload.single('image'), productController.updateProduct);
app.delete('/products/:id', authenticate, authorizeRole('fermer'), productController.deleteProduct);

// ✅ USER ROUTES (admin panel)
app.get('/users', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    handleError(res, err, 'Error fetching users');
  }
});

app.post('/users', authenticate, authorizeRole('admin'), async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(400).json({ message: 'User already exists!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, role });
    res.json({ message: 'User added successfully!', user });
  } catch (err) {
    handleError(res, err, 'Error adding user');
  }
});

app.delete('/users/:username', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { username: req.params.username } });
    if (deleted) res.json({ message: 'User deleted successfully!' });
    else res.status(404).json({ message: 'User not found!' });
  } catch (err) {
    handleError(res, err, 'Error deleting user');
  }
});

// ✅ ORDER ROUTES (dërgimi i kërkesave për blerje)
app.post('/orders', authenticate, orderController.createOrder);
app.get('/orders/:fermeri', authenticate, orderController.getOrdersByFarmer);
app.put('/orders/:id', authenticate, orderController.updateOrderStatus);

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`🚀 MerrBio backend running on http://localhost:${PORT}`);
});
