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

    if (!fermeri || !emri || !pershkrimi || !cmimi) {
      return res.status(400).json({ message: 'All fields (emri, pershkrimi, cmimi, fermeri) are required' });
    }

    if (!req.file || !req.file.secure_url) {
      return res.status(400).json({ message: 'Image upload failed or no image provided' });
    }

    const imageUrl = req.file.secure_url;

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
    console.error('❌ Error adding product:', err);
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { emri, pershkrimi, cmimi, fermeri } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const imageUrl = req.file ? req.file.secure_url : product.image;

    await product.update({
      emri: emri || product.emri,
      pershkrimi: pershkrimi || product.pershkrimi,
      cmimi: cmimi ? parseFloat(cmimi) : product.cmimi,
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
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};
