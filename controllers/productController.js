const Product = require('../models/Product');
const { deleteImageFromCloudinary } = require('../utils/cloudinaryUtils');

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
    if (!fermeri || !emri || !pershkrimi || !cmimi) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (emri.trim().length < 3) {
      return res.status(400).json({ message: 'Product name ≥ 3 characters' });
    }
    const price = parseFloat(cmimi);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    const imageUrl = req.file?.path || null;

    const product = await Product.create({
      emri: emri.trim(),
      pershkrimi: pershkrimi.trim(),
      cmimi: price,
      fermeri: fermeri.trim(),
      image: imageUrl,
    });

    res.json({ message: '✅ Product added successfully', product });
  } catch (err) {
    console.error('❌ Error adding product:', err);
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { emri, pershkrimi, cmimi } = req.body;
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.file && product.image) {
      await deleteImageFromCloudinary(product.image);
    }

    const updatedPrice = cmimi ? parseFloat(cmimi) : product.cmimi;
    if (cmimi && (isNaN(updatedPrice) || updatedPrice <= 0)) {
      return res.status(400).json({ message: 'Price must be positive' });
    }

    const imageUrl = req.file ? req.file.path : product.image;

    await product.update({
      emri: emri ? emri.trim() : product.emri,
      pershkrimi: pershkrimi ? pershkrimi.trim() : product.pershkrimi,
      cmimi: updatedPrice,
      image: imageUrl,
    });

    res.json({ message: '✅ Product updated successfully', product });
  } catch (err) {
    console.error('❌ Error updating product:', err);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.image) await deleteImageFromCloudinary(product.image);

    await product.destroy();
    res.json({ message: '✅ Product deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};
