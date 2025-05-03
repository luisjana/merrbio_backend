exports.createOrder = async (req, res) => {
  try {
    const { productId, buyerName, buyerContact } = req.body;
    if (!productId || !buyerName || !buyerContact) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const order = await Order.create({
      productId,
      fermeri: product.fermeri,
      buyerName,
      buyerContact,
    });

    res.json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        productId: order.productId,
        fermeri: order.fermeri,
        buyerName: order.buyerName,
        buyerContact: order.buyerContact,
        status: order.status,
      },
    });
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

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();

    res.json({ message: 'Order status updated', status: order.status });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order', error: err.message });
  }
};
