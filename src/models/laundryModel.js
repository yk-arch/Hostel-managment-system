const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Laundry = sequelize.define('Laundry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    items_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      // pending, processing, delivered
    },
    submitted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'laundry',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Laundry;