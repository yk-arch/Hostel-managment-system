const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expenditure = sequelize.define('Expenditure', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'other',
    },
    spent_by: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    spent_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    receipt_note: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    tableName: 'expenditures',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Expenditure;