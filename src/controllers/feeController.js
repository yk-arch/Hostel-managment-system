const Fee = require('../models/feeModel');
const Student = require('../models/studentModel');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({ status, message, data });
};

// ── GET ALL FEES ──────────────────────────────
const getAllFees = async (req, res) => {
  try {
    const fees = await Fee.findAll({
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'phone', 'room_no'],
      }],
      order: [['created_at', 'DESC']],
    });

    // Calculate totals
    const collected = fees
      .filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + parseFloat(f.amount), 0);
    const pending = fees
      .filter(f => f.status === 'pending')
      .reduce((sum, f) => sum + parseFloat(f.amount), 0);

    return sendResponse(res, 200, true, 'Fees fetched', {
      fees,
      summary: { collected, pending, total: collected + pending }
    });
  } catch (error) {
    console.error('Get fees error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── GET FEES BY STUDENT ───────────────────────
const getFeesByStudent = async (req, res) => {
  try {
    const fees = await Fee.findAll({
      where: { student_id: req.params.studentId },
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'phone'],
      }],
      order: [['created_at', 'DESC']],
    });
    return sendResponse(res, 200, true, 'Student fees fetched', { fees });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── GET PENDING FEES ──────────────────────────
const getPendingFees = async (req, res) => {
  try {
    const fees = await Fee.findAll({
      where: { status: 'pending' },
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'phone', 'room_no'],
      }],
      order: [['created_at', 'DESC']],
    });
    return sendResponse(res, 200, true, 'Pending fees fetched', { fees });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── CREATE FEE ────────────────────────────────
const createFee = async (req, res) => {
  try {
    const { student_id, amount, month, description, status } = req.body;

    if (!student_id || !amount || !month) {
      return sendResponse(res, 400, false,
        'Student, amount and month are required');
    }

    const student = await Student.findByPk(student_id);
    if (!student) {
      return sendResponse(res, 404, false, 'Student not found');
    }

    const fee = await Fee.create({
      student_id,
      amount: parseFloat(amount),
      month,
      description: description || null,
      status: status || 'pending',
      paid_at: status === 'paid' ? new Date() : null,
    });

    const feeWithStudent = await Fee.findByPk(fee.id, {
      include: [{ model: Student, as: 'student',
        attributes: ['id', 'name', 'phone', 'room_no'] }],
    });

    return sendResponse(res, 201, true, 'Fee record created', {
      fee: feeWithStudent
    });
  } catch (error) {
    console.error('Create fee error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── MARK FEE AS PAID ──────────────────────────
const markAsPaid = async (req, res) => {
  try {
    const fee = await Fee.findByPk(req.params.id);
    if (!fee) return sendResponse(res, 404, false, 'Fee not found');

    await fee.update({
      status: 'paid',
      paid_at: new Date(),
    });

    return sendResponse(res, 200, true, 'Fee marked as paid', { fee });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── DELETE FEE ────────────────────────────────
const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findByPk(req.params.id);
    if (!fee) return sendResponse(res, 404, false, 'Fee not found');
    await fee.destroy();
    return sendResponse(res, 200, true, 'Fee deleted successfully');
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

module.exports = {
  getAllFees,
  getFeesByStudent,
  getPendingFees,
  createFee,
  markAsPaid,
  deleteFee,
};
