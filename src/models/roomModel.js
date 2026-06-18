const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    room_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    floor: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    occupied: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    price_per_month: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'available',
      // available, full, maintenance
    },
  },
  {
    tableName: 'rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Room;