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
    console.log('➡️ req.body:', req.body);
    console.log('➡️ req.file:', req.file);

    const { emri, pershkrimi, cmimi, fermeri } = req.body;

    if (!fermeri || !emri || !pershkrimi || !cmimi) {
      return res.status(400).json({ message: 'All fields (emri, pershkrimi, cmimi, fermeri) are required' });
    }

    const imageUrl = req.file ? (req.file.path || req.file.secure_url) : null;

    const product = await Product.create({
      emri: emri.trim(),
      pershkrimi: pershkrimi.trim(),
      cmimi: parseFloat(cmimi),
      fermeri: fermeri.trim(),
      image: imageUrl,
    });

    console.log('✅ Product created:\n', JSON.stringify(product, null, 2));
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

    const imageUrl = req.file ? (req.file.path || req.file.secure_url) : product.image;

    await product.update({
      emri: emri || product.emri,
      pershkrimi: pershkrimi || product.pershkrimi,
      cmimi: cmimi ? parseFloat(cmimi) : product.cmimi,
      fermeri: fermeri || product.fermeri,
      image: imageUrl,
    });

    console.log('✅ Product updated:\n', JSON.stringify(product, null, 2));
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
      console.log(`✅ Product deleted: ID ${id}`);
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};

module.exports = {
  getAllProducts: exports.getAllProducts,
  createProduct: exports.createProduct,
  updateProduct: exports.updateProduct,
  deleteProduct: exports.deleteProduct,
};
