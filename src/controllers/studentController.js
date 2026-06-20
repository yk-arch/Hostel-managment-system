const Student = require('../models/studentModel');
const Notification = require('../models/notificationModel');
const { Op } = require('sequelize');

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({ status, message, data });
};

// GET all students
exports.getAllStudents = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search ? { name: { [Op.iLike]: `%${search}%` } } : {};
    const students = await Student.findAll({ where, order: [['created_at', 'DESC']] });
    return sendResponse(res, 200, true, 'Students fetched', { students });
  } catch (e) {
    console.error('Get students error:', e);
    return sendResponse(res, 500, false, e.message);
  }
};

// GET single student
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return sendResponse(res, 404, false, 'Student not found');
    return sendResponse(res, 200, true, 'Student fetched', { student });
  } catch (e) {
    console.error('Get student error:', e);
    return sendResponse(res, 500, false, e.message);
  }
};

// POST create student
exports.createStudent = async (req, res) => {
  try {
    const { name, email, phone, cnic, father_name, address, room_no } = req.body;
    if (!name || !phone) {
      return sendResponse(res, 400, false, 'Name and phone are required');
    }
    const student = await Student.create({ name, email, phone, cnic, father_name, address, room_no });
    
    // Create notification
    await Notification.create({
      title: 'New Student Added',
      message: `New student ${name} has been added to the hostel!`,
      type: 'success',
    });

    return sendResponse(res, 201, true, 'Student created successfully', { student });
  } catch (e) {
    console.error('Create student error:', e);
    if (e.name === 'SequelizeUniqueConstraintError') {
      return sendResponse(res, 400, false, 'Email or CNIC already exists');
    }
    return sendResponse(res, 500, false, e.message);
  }
};

// PUT update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return sendResponse(res, 404, false, 'Student not found');
    await student.update(req.body);
    return sendResponse(res, 200, true, 'Student updated successfully', { student });
  } catch (e) {
    console.error('Update student error:', e);
    return sendResponse(res, 500, false, e.message);
  }
};

// DELETE student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return sendResponse(res, 404, false, 'Student not found');
    await student.destroy();
    return sendResponse(res, 200, true, 'Student deleted successfully');
  } catch (e) {
    console.error('Delete student error:', e);
    return sendResponse(res, 500, false, e.message);
  }
};
