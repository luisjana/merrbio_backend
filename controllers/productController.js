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
    console.log('➡️ Body:', req.body);
    console.log('➡️ File:', req.file);

    const { emri, pershkrimi, cmimi, fermeri } = req.body;

    // Kontrollo fushat e kërkuara
    if (!fermeri) {
      console.warn('⚠️ Field "fermeri" is missing in request');
      return res.status(400).json({ message: 'Field "fermeri" is required' });
    }

    if (!req.file) {
      console.warn('⚠️ No image file was uploaded');
      return res.status(400).json({ message: 'Image upload failed or no image provided' });
    }

    // Merr path ose secure_url në mënyrë fleksibile
    const imageUrl = req.file.secure_url || req.file.path;

    if (!imageUrl) {
      console.warn('⚠️ Could not extract image URL from uploaded file');
      return res.status(500).json({ message: 'Failed to process uploaded image' });
    }

    // Krijo produktin
    const product = await Product.create({
      emri: emri.trim(),
      pershkrimi: pershkrimi.trim(),
      cmimi: parseFloat(cmimi),
      fermeri: fermeri.trim(),
      image: imageUrl,
    });

    console.log('✅ Product created:', product.toJSON());
    res.json({ message: 'Product added successfully', product });

  } catch (err) {
    console.error('❌ Error adding product:', err.message, err.stack);
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
