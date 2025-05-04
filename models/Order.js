const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Order = sequelize.define('Order', {
  productId: { type: DataTypes.INTEGER, allowNull: false },
  fermeri: { type: DataTypes.STRING, allowNull: false },
  buyerName: { type: DataTypes.STRING, allowNull: false },
  buyerContact: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
});

module.exports = Order;

