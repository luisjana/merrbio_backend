const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

require('dotenv').config();

const { storage } = require('./cloudinaryConfig');
const sequelize = require('./db');
const User = require('./models/User');
const productController = require('./controllers/productController');
const orderController = require('./controllers/orderController');
const authenticate = require('./middleware/authenticate');
const authorizeRole = require('./middleware/authorizeRole');

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
app.use('/uploads', express.static('uploads'));

// ✅ Konfigurimi i multer me Cloudinary
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (extname && mimeType) return cb(null, true);
    cb('Only image files can be uploaded!');
  },
});

// ✅ Sinkronizimi i databazës
sequelize.sync().then(() => {
  console.log('📦 Databaza u sinkronizua me sukses!');
});

// ================= ROUTES =================

// 🔐 Regjistrimi
app.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters'),
    body('role').notEmpty().withMessage('Role is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role } = req.body;
    try {
      const existing = await User.findOne({ where: { username: username.trim() } });
      if (existing) return res.status(400).json({ message: 'User already exists!' });

      const user = await User.create({
        username: username.trim(),
        password: password.trim(),
        role: role.toLowerCase(),
      });

      res.json({ message: 'Registration successful!', username: user.username, role: user.role });
    } catch (err) {
      res.status(500).json({ message: 'Error during registration', error: err.message });
    }
  }
);

// 🔐 Login + JWT token
app.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').notEmpty().withMessage('Role is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role } = req.body;
    try {
      const user = await User.findOne({
        where: {
          username: username.trim(),
          password: password.trim(),
        },
      });

      if (!user) return res.status(401).json({ message: 'Invalid credentials!' });
      if (user.role.toLowerCase() !== role.toLowerCase()) {
        return res.status(401).json({ message: 'Role does not match credentials!' });
      }

      const token = jwt.sign(
        { username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({
        message: 'Login successful!',
        token,
        role: user.role,
        username: user.username,
      });
    } catch (err) {
      res.status(500).json({ message: 'Error during login', error: err.message });
    }
  }
);

// 📦 PRODUCT ROUTES (të mbrojtura me JWT)
app.get('/products', authenticate, productController.getAllProducts);
app.post('/products', authenticate, upload.single('image'), productController.createProduct);
app.put('/products/:id', authenticate, upload.single('image'), productController.updateProduct);
app.delete('/products/:id', authenticate, productController.deleteProduct);

// 👥 USER ROUTES (admin only)
app.get('/users', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

app.post('/users', authenticate, authorizeRole('admin'), async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const existing = await User.findOne({ where: { username: username.trim() } });
    if (existing) return res.status(400).json({ message: 'User already exists!' });

    const user = await User.create({ username, password, role });
    res.json({ message: 'User added successfully!', user });
  } catch (err) {
    res.status(500).json({ message: 'Error adding user', error: err.message });
  }
});

app.delete('/users/:username', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { username: req.params.username } });
    if (deleted) res.json({ message: 'User deleted successfully!' });
    else res.status(404).json({ message: 'User not found!' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

// 📦 ORDER ROUTES (konsumator & fermer)
app.post('/orders', authenticate, authorizeRole('konsumator'), orderController.createOrder);
app.get('/orders/:fermeri', authenticate, authorizeRole('fermer'), orderController.getOrdersByFarmer);
app.put('/orders/:id', authenticate, authorizeRole('fermer'), orderController.updateOrderStatus);

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 MerrBio backend running on http://localhost:${PORT}`);
});
