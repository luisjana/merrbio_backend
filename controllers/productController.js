const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error('❌ Error getting products:', err.message, err.stack);
    res.status(500).json({ message: 'Error getting products', error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { emri, pershkrimi, cmimi, fermeri } = req.body;

    // Kontrollo nëse mungon fermeri
    if (!fermeri) {
      console.warn('⚠️ Field "fermeri" is missing in request');
      return res.status(400).json({ message: 'Field "fermeri" is required' });
    }

    // Kontrollo nëse mungon file (imazhi)
    if (!req.file) {
      console.warn('⚠️ No image file was uploaded');
      return res.status(400).json({ message: 'Image upload failed or no image provided' });
    }

    // Merr path-in e fotos nga Cloudinary
    const imageUrl = req.file.path;

    // Krijo produktin në database
    const product = await Product.create({
      emri,
      pershkrimi,
      cmimi: parseInt(cmimi),
      fermeri,
      image: imageUrl,
    });

    console.log('✅ Product created:', product.id);
    res.json({ message: 'Product added successfully', product });
  } catch (err) {
    console.error('❌ Error adding product:', err.message);
    console.error('❌ Stack trace:', err.stack);
    res.status(500).json({ message: 'Error adding product', error: err.message });
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

    console.log('✅ Product updated:', product.id);
    res.json({ message: 'Product updated successfully', product });
  } catch (err) {
    console.error('❌ Error updating product:', err.message, err.stack);
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
    console.error('❌ Error deleting product:', err.message, err.stack);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};
