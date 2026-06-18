const Expenditure = require('../models/expenditureModel');
const { Op } = require('sequelize');

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({ status, message, data });
};

// ── GET ALL EXPENDITURES ──────────────────────
const getAllExpenditures = async (req, res) => {
  try {
    const expenditures = await Expenditure.findAll({
      order: [['spent_date', 'DESC'],
              ['created_at', 'DESC']],
    });

    // Calculate totals
    const total = expenditures.reduce(
      (sum, e) => sum + parseFloat(e.amount), 0);

    // Group by category
    const byCategory = expenditures.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) +
        parseFloat(e.amount);
      return acc;
    }, {});

    // This month total
    const now = new Date();
    const thisMonth = expenditures
      .filter(e => {
        const d = new Date(e.spent_date);
        return d.getMonth() === now.getMonth() &&
               d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return sendResponse(res, 200, true,
      'Expenditures fetched', {
        expenditures,
        summary: { total, thisMonth, byCategory }
      });
  } catch (error) {
    console.error('Get expenditures error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── CREATE EXPENDITURE ────────────────────────
const createExpenditure = async (req, res) => {
  try {
    const {
      title, amount, category,
      spent_by, description, spent_date, receipt_note
    } = req.body;

    if (!title || !amount || !spent_by) {
      return sendResponse(res, 400, false,
        'Title, amount and spent_by are required');
    }

    const expenditure = await Expenditure.create({
      title,
      amount: parseFloat(amount),
      category: category || 'other',
      spent_by,
      description: description || null,
      spent_date: spent_date || new Date(),
      receipt_note: receipt_note || null,
    });

    return sendResponse(res, 201, true,
      'Expenditure recorded', { expenditure });
  } catch (error) {
    console.error('Create expenditure error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── UPDATE EXPENDITURE ────────────────────────
const updateExpenditure = async (req, res) => {
  try {
    const exp = await Expenditure.findByPk(req.params.id);
    if (!exp) {
      return sendResponse(res, 404, false,
        'Expenditure not found');
    }
    await exp.update(req.body);
    return sendResponse(res, 200, true,
      'Expenditure updated', { expenditure: exp });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── DELETE EXPENDITURE ────────────────────────
const deleteExpenditure = async (req, res) => {
  try {
    const exp = await Expenditure.findByPk(req.params.id);
    if (!exp) {
      return sendResponse(res, 404, false,
        'Expenditure not found');
    }
    await exp.destroy();
    return sendResponse(res, 200, true,
      'Expenditure deleted');
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

module.exports = {
  getAllExpenditures, createExpenditure,
  updateExpenditure, deleteExpenditure,
};