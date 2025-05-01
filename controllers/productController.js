const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error('❌ Error getting products:', err);
    res.status(500).json({ message: 'Error getting products', error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { emri, pershkrimi, cmimi, fermeri } = req.body;

    if (!fermeri) {
      console.warn('⚠️ Field "fermeri" is missing in request');
      return res.status(400).json({ message: 'Field "fermeri" is required' });
    }

    if (!req.file) {
      console.warn('⚠️ No image file was uploaded');
      return res.status(400).json({ message: 'Image upload failed or no image provided' });
    }

    const imageUrl = req.file.path || req.file.secure_url;

    const product = await Product.create({
      emri,
      pershkrimi,
      cmimi: parseInt(cmimi),
      fermeri,
      image: imageUrl,
    });

    console.log('✅ Product created:', product.toJSON());
    res.json({ message: 'Product added successfully', product });
  } catch (err) {
    console.error('❌ Error adding product:', {
      message: err.message,
      stack: err.stack,
      full: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
    });
    res.status(500).json({
      message: 'Error adding product',
      error: err.message || 'Unknown error',
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { emri, pershkrimi, cmimi, fermeri } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      console.warn(`⚠️ Product with ID ${id} not found`);
      return res.status(404).json({ message: 'Product not found' });
    }

    const imageUrl = req.file ? req.file.path : product.image;

    await product.update({
      emri: emri || product.emri,
      pershkrimi: pershkrimi || product.pershkrimi,
      cmimi: cmimi ? parseInt(cmimi) : product.cmimi,
      fermeri: fermeri || product.fermeri,
      image: imageUrl,
    });

    console.log('✅ Product updated:', product.toJSON());
    res.json({ message: 'Product updated successfully', product });
  } catch (err) {
    console.error('❌ Error updating product:', err);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.destroy({ where: { id } });
    if (deleted) {
      console.log('✅ Product deleted:', id);
      res.json({ message: 'Product deleted successfully' });
    } else {
      console.warn(`⚠️ Product with ID ${id} not found`);
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};
