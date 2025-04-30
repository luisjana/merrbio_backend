// db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'postgresql://postgres:ckfUqhAtDOHWqKjYBeCRmXKASqiIEeUA@ballast.proxy.rlwy.net:18830/railway',
  {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

module.exports = sequelize;
