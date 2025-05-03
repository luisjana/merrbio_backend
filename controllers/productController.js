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
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (isNaN(cmimi) || parseFloat(cmimi) <= 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' });
    }

    const imageUrl = req.file?.path || req.file?.secure_url || null;

    const product = await Product.create({
      emri: emri.trim(),
      pershkrimi: pershkrimi.trim(),
      cmimi: parseFloat(cmimi),
      fermeri: fermeri.trim(),
      image: imageUrl,
    });

    res.json({
      message: 'Product added successfully',
      product: {
        id: product.id,
        emri: product.emri,
        pershkrimi: product.pershkrimi,
        cmimi: product.cmimi,
        fermeri: product.fermeri,
        image: product.image,
      },
    });
  } catch (err) {
    console.error('❌ Error adding product:', err);
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { emri, pershkrimi, cmimi, fermeri } = req.body;

    if (!emri && !pershkrimi && !cmimi && !fermeri && !req.file) {
      return res.status(400).json({ message: 'At least one field is required for update' });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const imageUrl = req.file ? req.file.path : product.image;

    await product.update({
      emri: emri ? emri.trim() : product.emri,
      pershkrimi: pershkrimi ? pershkrimi.trim() : product.pershkrimi,
      cmimi: cmimi ? parseFloat(cmimi) : product.cmimi,
      fermeri: fermeri ? fermeri.trim() : product.fermeri,
      image: imageUrl,
    });

    console.log('✅ Product updated:\n', JSON.stringify(product, null, 2));
    res.json({
      message: 'Product updated successfully',
      product: {
        id: product.id,
        emri: product.emri,
        pershkrimi: product.pershkrimi,
        cmimi: product.cmimi,
        fermeri: product.fermeri,
        image: product.image,
      },
    });
  } catch (err) {
    console.error('❌ Error updating product:', err);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};
