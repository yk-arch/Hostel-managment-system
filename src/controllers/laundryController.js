const Laundry = require('../models/laundryModel');
const Student = require('../models/studentModel');

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({ status, message, data });
};

// ── GET ALL LAUNDRY ───────────────────────────
const getAllLaundry = async (req, res) => {
  try {
    const laundry = await Laundry.findAll({
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'phone', 'room_no'],
      }],
      order: [['created_at', 'DESC']],
    });
    return sendResponse(res, 200, true, 'Laundry fetched', { laundry });
  } catch (error) {
    console.error('Get laundry error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── GET LAUNDRY BY STUDENT ────────────────────
const getLaundryByStudent = async (req, res) => {
  try {
    const laundry = await Laundry.findAll({
      where: { student_id: req.params.studentId },
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'phone'],
      }],
      order: [['created_at', 'DESC']],
    });
    return sendResponse(res, 200, true, 'Student laundry fetched', { laundry });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── CREATE LAUNDRY ────────────────────────────
const createLaundry = async (req, res) => {
  try {
    const { student_id, items_count, description } = req.body;
    if (!student_id) {
      return sendResponse(res, 400, false, 'Student ID is required');
    }
    const student = await Student.findByPk(student_id);
    if (!student) {
      return sendResponse(res, 404, false, 'Student not found');
    }
    const laundry = await Laundry.create({
      student_id,
      items_count: items_count || 1,
      description: description || null,
      status: 'pending',
    });
    const laundryWithStudent = await Laundry.findByPk(laundry.id, {
      include: [{ model: Student, as: 'student', attributes: ['id', 'name', 'phone', 'room_no'] }],
    });
    return sendResponse(res, 201, true, 'Laundry created', { laundry: laundryWithStudent });
  } catch (error) {
    console.error('Create laundry error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── UPDATE LAUNDRY STATUS ─────────────────────
const updateStatus = async (req, res) => {
  try {
    const laundry = await Laundry.findByPk(req.params.id);
    if (!laundry) {
      return sendResponse(res, 404, false, 'Laundry not found');
    }
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'delivered'];
    if (!validStatuses.includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status. Use: pending, processing, delivered');
    }
    await laundry.update({
      status,
      delivered_at: status === 'delivered' ? new Date() : null,
    });
    return sendResponse(res, 200, true, 'Laundry status updated', { laundry });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── DELETE LAUNDRY ────────────────────────────
const deleteLaundry = async (req, res) => {
  try {
    const laundry = await Laundry.findByPk(req.params.id);
    if (!laundry) {
      return sendResponse(res, 404, false, 'Laundry not found');
    }
    await laundry.destroy();
    return sendResponse(res, 200, true, 'Laundry deleted');
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

module.exports = {
  getAllLaundry,
  getLaundryByStudent,
  createLaundry,
  updateStatus,
  deleteLaundry,
};
