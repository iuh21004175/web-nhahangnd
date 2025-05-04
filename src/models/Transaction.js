const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  gateway: DataTypes.STRING,
  transaction_date: DataTypes.STRING,
  account_number: DataTypes.STRING,
  sub_account: DataTypes.STRING,
  amount_in: DataTypes.INTEGER,
  amount_out: DataTypes.INTEGER,
  accumulated: DataTypes.INTEGER,
  code: DataTypes.STRING,
  transaction_content: DataTypes.TEXT,
  reference_number: DataTypes.STRING,
  body: DataTypes.TEXT,
}, {
  tableName: 'tb_transactions',
  timestamps: false
});

module.exports = Transaction;
