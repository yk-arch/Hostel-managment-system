const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fee = sequelize.define('Fee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    month: { type: DataTypes.STRING(20), allowNull: false },
    status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'fees',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Fee;