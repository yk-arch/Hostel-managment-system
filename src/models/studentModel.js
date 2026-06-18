const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    cnic: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    father_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    room_no: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
    },
  },
  {
    tableName: 'students',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Student;