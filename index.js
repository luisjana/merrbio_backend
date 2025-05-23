const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'MerrBio API',
      version: '1.0.0',
      description: 'Dokumentimi i API-ve për MerrBio',
    },
    servers: [

      {
        url: 'https://merrbio-backend.onrender.com',
        description: 'Serveri i deploy-uar në Render',
      },
    ],
  },
  apis: ['./index.js', './controllers/*.js'], // ose ['./routes/*.js'] nëse i ke në routes
};


require('dotenv').config();

const { storage } = require('./cloudinaryConfig');
const sequelize = require('./db');
const User = require('./models/User');
const productController = require('./controllers/productController');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS për frontendin në Vercel dhe Swagger në Render
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      undefined, // për kërkesa pa origin (Postman, backend të brendshëm)
      'https://merrbio-frontend.vercel.app',
      'https://merrbio-backend.onrender.com' // për Swagger UI
    ];

    if (!origin || allowedOrigins.includes(origin) || /^https:\/\/merrbio-frontend.*\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      console.error('❌ CORS i ndaluar për:', origin);
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

app.post('/products', upload.single('image'), productController.createProduct);
app.put('/products/:id', upload.single('image'), productController.updateProduct);



// ✅ Sinkronizimi i databazës
sequelize.sync().then(() => {
  console.log('📦 Databaza u sinkronizua me sukses!');
});

// ================= ROUTES =================
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Regjistron një përdorues të ri
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, fermer, konsumator]
 *     responses:
 *       200:
 *         description: Përdoruesi u regjistrua me sukses
 *       400:
 *         description: Gabim në validim ose përdoruesi ekziston
 *       500:
 *         description: Gabim gjatë regjistrimit
 */

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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Bën login dhe kthen JWT token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login i suksesshëm me token JWT
 *       401:
 *         description: Kredencialet nuk janë të sakta
 */

// 🔐 Login
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

      // ✅ GJENERO TOKEN
      const token = jwt.sign(
        { username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' } // Tokeni skadon pas 1 ore
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



// 📦 PRODUCT ROUTES ME CONTROLLER
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Merr të gjitha produktet
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Lista e produkteve
 */

app.get('/products', productController.getAllProducts);
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Shton një produkt të ri
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               emri:
 *                 type: string
 *               pershkrimi:
 *                 type: string
 *               cmimi:
 *                 type: number
 *               fermeri:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Produkti u shtua me sukses
 */

app.post('/products', upload.single('image'), productController.createProduct);
app.put('/products/:id', upload.single('image'), productController.updateProduct);
app.delete('/products/:id', productController.deleteProduct);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Merr të gjithë përdoruesit
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Lista e përdoruesve
 */

// 👥 Merr përdoruesit
app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Shton një përdorues të ri
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Përdoruesi u shtua me sukses
 */

// 👤 Shto përdorues
app.post('/users', async (req, res) => {
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
/**
 * @swagger
 * /users/{username}:
 *   delete:
 *     summary: Fshin një përdorues sipas emrit
 *     tags:
 *       - Users
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Përdoruesi u fshi me sukses
 *       404:
 *         description: Përdoruesi nuk u gjet
 */

// ❌ Fshi përdorues
app.delete('/users/:username', async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { username: req.params.username } });
    if (deleted) res.json({ message: 'User deleted successfully!' });
    else res.status(404).json({ message: 'User not found!' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});
const orderController = require('./controllers/orderController');
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Shton një produkt të ri
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               emri:
 *                 type: string
 *               pershkrimi:
 *                 type: string
 *               cmimi:
 *                 type: number
 *               fermeri:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Produkti u shtua me sukses
 */

app.post('/orders', orderController.createOrder);
/**
 * @swagger
 * /orders/{fermeri}:
 *   get:
 *     summary: Merr porositë e një fermeri
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: fermeri
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista e porosive
 */

app.get('/orders/:fermeri', orderController.getOrdersByFarmer);
// index.js
app.put('/orders/:id', orderController.updateOrderStatus);


const swaggerDocs = swaggerJSDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 MerrBio backend running on http://localhost:${PORT}`);
});
