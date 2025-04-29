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
    allowNull: true,
  }
});

module.exports = Product;
