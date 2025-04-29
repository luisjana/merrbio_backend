// db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/merrbio.sqlite' // file lokal i databazës
});

module.exports = sequelize;
