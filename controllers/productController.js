const Product = require('../models/Product');

// 📦 Merr të gjithë produktet
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë marrjes së produkteve', error: err.message });
  }
};

// 🧺 Krijo produkt të ri
exports.createProduct = async (req, res) => {
  try {
    const { emri, pershkrimi, cmimi, fermeri } = req.body;
    if (!fermeri) return res.status(400).json({ message: 'Fusha "fermeri" është e detyrueshme' });

    const imageUrl = req.file ? req.file.secure_url || req.file.path : '';

    const newProduct = await Product.create({
      emri,
      pershkrimi,
      cmimi,
      fermeri,
      image: imageUrl,
    });

    res.json({ message: 'Produkti u shtua me sukses!', product: newProduct });
  } catch (err) {
    console.error('Gabim gjatë shtimit të produktit:', err);
    res.status(500).json({ message: 'Gabim gjatë shtimit të produktit', error: err.message });
  }
};

// 🔄 Përditëso produkt
exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const { emri, pershkrimi, cmimi, fermeri } = req.body;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: 'Produkti nuk u gjet!' });

    let imageUrl = product.image;
    if (req.file && req.file.secure_url) imageUrl = req.file.secure_url;
    else if (req.file && req.file.path) imageUrl = req.file.path;

    await product.update({
      emri: emri || product.emri,
      pershkrimi: pershkrimi || product.pershkrimi,
      cmimi: cmimi || product.cmimi,
      fermeri: fermeri || product.fermeri,
      image: imageUrl,
    });

    res.json({ message: 'Produkti u përditësua me sukses!', product });
  } catch (err) {
    console.error('Gabim gjatë përditësimit të produktit:', err);
    res.status(500).json({ message: 'Gabim gjatë përditësimit të produktit', error: err.message });
  }
};

// 🗑️ Fshi produkt
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    if (deleted) res.json({ message: 'Produkti u fshi me sukses!' });
    else res.status(404).json({ message: 'Produkti nuk u gjet!' });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë fshirjes së produktit', error: err.message });
  }
};
