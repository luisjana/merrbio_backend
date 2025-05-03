const Order = require('../models/Order');
const Product = require('../models/Product');

exports.createOrder = async (req, res) => {
  try {
    const { productId, buyerName, buyerContact } = req.body;

    // Validime bazë
    if (!buyerName || buyerName.trim().length < 3) {
      return res.status(400).json({ message: 'Buyer name must be at least 3 characters' });
    }
    if (!buyerContact || buyerContact.trim().length < 6) {
      return res.status(400).json({ message: 'Buyer contact must be at least 6 characters' });
    }

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const order = await Order.create({
      productId,
      fermeri: product.fermeri,
      buyerName: buyerName.trim(),
      buyerContact: buyerContact.trim(),
      status: 'pending', // default status
    });

    res.json({ message: 'Order created successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
};

exports.getOrdersByFarmer = async (req, res) => {
  try {
    const { fermeri } = req.params;

    const orders = await Order.findAll({
      where: { fermeri },
      order: [['createdAt', 'DESC']],
      include: [{ model: Product, attributes: ['emri'] }],
    });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kontroll statusi i lejuar
    const allowedStatuses = ['pending', 'confirmed', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update order', error: err.message });
  }
};
