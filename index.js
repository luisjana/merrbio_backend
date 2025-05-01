const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const { storage } = require('./cloudinaryConfig');
const sequelize = require('./db');
const User = require('./models/User');
const productController = require('./controllers/productController');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'PUT'], credentials: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(file.originalname.toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (extname && mimeType) cb(null, true);
    else cb(new Error('Only image files are allowed!'));
  },
});

sequelize.sync().then(() => console.log('📦 Database synced'));

app.get('/products', productController.getAllProducts);
app.post('/products', upload.single('image'), productController.createProduct);
app.put('/products/:id', upload.single('image'), productController.updateProduct);
app.delete('/products/:id', productController.deleteProduct);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
