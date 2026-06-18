const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Complaint = sequelize.define('Complaint', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      defaultValue: 'general',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'open',
      // open, in_progress, resolved
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    admin_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'complaints',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Complaint;