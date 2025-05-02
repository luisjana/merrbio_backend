const Order = require('../models/Order');
const Product = require('../models/Product');

exports.createOrder = async (req, res) => {
  try {
    const { productId, buyerName, buyerContact } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const order = await Order.create({
      productId,
      fermeri: product.fermeri,
      buyerName,
      buyerContact,
    });

    res.json({ message: 'Order created successfully', order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
};

exports.getOrdersByFarmer = async (req, res) => {
  try {
    const { fermeri } = req.params;
    const orders = await Order.findAll({ where: { fermeri } });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};
