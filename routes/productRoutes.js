const express = require('express');
const multer = require('multer');
const { storage } = require('../cloudinaryConfig');
const upload = multer({ storage });
const ProductController = require('../controllers/productController');

const router = express.Router();

router.put('/products/:id', upload.single('image'), ProductController.updateProduct);
router.delete('/products/:id', ProductController.deleteProduct);
router.post('/products', upload.single('image'), ProductController.createProduct);

module.exports = router;
