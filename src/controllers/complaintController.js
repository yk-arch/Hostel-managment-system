const Complaint = require('../models/complaintModel');
const Student = require('../models/studentModel');
const { Op } = require('sequelize');

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({ status, message, data });
};

// ── GET ALL COMPLAINTS ────────────────────────
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.findAll({
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'phone', 'room_no'],
      }],
      order: [['created_at', 'DESC']],
    });

    const summary = {
      total: complaints.length,
      open: complaints.filter(c => c.status === 'open').length,
      in_progress: complaints.filter(
        c => c.status === 'in_progress').length,
      resolved: complaints.filter(
        c => c.status === 'resolved').length,
    };

    return sendResponse(res, 200, true,
      'Complaints fetched', { complaints, summary });
  } catch (error) {
    console.error('Get complaints error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── GET COMPLAINT BY ID ───────────────────────
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(
      req.params.id, {
        include: [{
          model: Student, as: 'student',
          attributes: ['id', 'name', 'phone', 'room_no'],
        }],
      }
    );
    if (!complaint) {
      return sendResponse(res, 404, false,
        'Complaint not found');
    }
    return sendResponse(res, 200, true,
      'Complaint fetched', { complaint });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── CREATE COMPLAINT ──────────────────────────
const createComplaint = async (req, res) => {
  try {
    const { student_id, title, description, category } =
      req.body;

    if (!student_id || !title || !description) {
      return sendResponse(res, 400, false,
        'Student, title and description are required');
    }

    const student = await Student.findByPk(student_id);
    if (!student) {
      return sendResponse(res, 404, false,
        'Student not found');
    }

    const complaint = await Complaint.create({
      student_id,
      title,
      description,
      category: category || 'general',
      status: 'open',
    });

    const complaintWithStudent = await Complaint.findByPk(
      complaint.id, {
        include: [{
          model: Student, as: 'student',
          attributes: ['id', 'name', 'phone', 'room_no'],
        }],
      }
    );

    return sendResponse(res, 201, true,
      'Complaint created', { complaint: complaintWithStudent });
  } catch (error) {
    console.error('Create complaint error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── UPDATE STATUS ─────────────────────────────
const updateStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(
      req.params.id);
    if (!complaint) {
      return sendResponse(res, 404, false,
        'Complaint not found');
    }

    const { status, admin_note } = req.body;
    const validStatuses = ['open','in_progress','resolved'];

    if (!validStatuses.includes(status)) {
      return sendResponse(res, 400, false,
        'Invalid status. Use: open, in_progress, resolved');
    }

    await complaint.update({
      status,
      admin_note: admin_note || complaint.admin_note,
      resolved_at: status === 'resolved'
        ? new Date() : null,
    });

    return sendResponse(res, 200, true,
      'Complaint status updated', { complaint });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── DELETE COMPLAINT ──────────────────────────
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(
      req.params.id);
    if (!complaint) {
      return sendResponse(res, 404, false,
        'Complaint not found');
    }
    await complaint.destroy();
    return sendResponse(res, 200, true,
      'Complaint deleted');
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

module.exports = {
  getAllComplaints, getComplaintById,
  createComplaint, updateStatus, deleteComplaint,
};