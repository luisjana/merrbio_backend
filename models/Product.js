const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Product = sequelize.define('Product', {
  emri: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pershkrimi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  cmimi: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fermeri: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,  // shumë e rëndësishme për të lejuar pa foto
  },
});

module.exports = Product;

const Order = require('./Order');
Product.hasMany(Order, { foreignKey: 'productId' });
