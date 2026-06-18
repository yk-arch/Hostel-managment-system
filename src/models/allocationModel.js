const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Allocation = sequelize.define('Allocation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    allocated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    vacated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      // active, vacated
    },
  },
  {
    tableName: 'allocations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Allocation;