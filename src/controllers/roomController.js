const Room = require('../models/roomModel');
const Student = require('../models/studentModel');
const Allocation = require('../models/allocationModel');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({ status, message, data });
};

// ── GET ALL ROOMS ─────────────────────────────
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      order: [['room_number', 'ASC']],
      include: [
        {
          model: Student,
          as: 'students',
          through: {
            attributes: [],
            where: { status: 'active' },
          },
        },
      ],
    });
    return sendResponse(res, 200, true, 'Rooms fetched', { rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── GET AVAILABLE ROOMS ───────────────────────
const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: { status: 'available' },
      order: [['room_number', 'ASC']],
    });
    return sendResponse(res, 200, true, 'Available rooms fetched', { rooms });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── GET ROOM BY ID ────────────────────────────
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'students',
          through: {
            attributes: [],
            where: { status: 'active' },
          },
        },
      ],
    });
    if (!room) return sendResponse(res, 404, false, 'Room not found');
    return sendResponse(res, 200, true, 'Room fetched', { room });
  } catch (error) {
    console.error('Get room by id error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── CREATE ROOM ───────────────────────────────
const createRoom = async (req, res) => {
  try {
    const { room_number, floor, capacity, price_per_month } = req.body;

    if (!room_number || !capacity || !price_per_month) {
      return sendResponse(res, 400, false,
        'Room number, capacity and price are required');
    }

    const existing = await Room.findOne({ where: { room_number } });
    if (existing) {
      return sendResponse(res, 409, false, 'Room number already exists');
    }

    const room = await Room.create({
      room_number,
      floor: floor || '1',
      capacity: parseInt(capacity),
      occupied: 0,
      price_per_month: parseFloat(price_per_month),
      status: 'available',
    });

    return sendResponse(res, 201, true, 'Room created successfully', { room });
  } catch (error) {
    console.error('Create room error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendResponse(res, 409, false, 'Room number already exists');
    }
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── UPDATE ROOM ───────────────────────────────
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return sendResponse(res, 404, false, 'Room not found');

    const { room_number, floor, capacity, price_per_month, status } = req.body;

    await room.update({
      room_number: room_number || room.room_number,
      floor: floor || room.floor,
      capacity: capacity ? parseInt(capacity) : room.capacity,
      price_per_month: price_per_month
        ? parseFloat(price_per_month)
        : room.price_per_month,
      status: status || room.status,
    });

    return sendResponse(res, 200, true, 'Room updated successfully', { room });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── DELETE ROOM ───────────────────────────────
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return sendResponse(res, 404, false, 'Room not found');

    if (room.occupied > 0) {
      return sendResponse(res, 400, false,
        'Cannot delete room with active occupants');
    }

    await room.destroy();
    return sendResponse(res, 200, true, 'Room deleted successfully');
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── ALLOCATE ROOM ─────────────────────────────
const allocateRoom = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { student_id, room_id, allocated_at, notes } = req.body;

    if (!student_id || !room_id) {
      await t.rollback();
      return sendResponse(res, 400, false,
        'Student ID and Room ID are required');
    }

    // Check room exists and has space
    const room = await Room.findByPk(room_id, { transaction: t });
    if (!room) {
      await t.rollback();
      return sendResponse(res, 404, false, 'Room not found');
    }

    if (room.occupied >= room.capacity) {
      await t.rollback();
      return sendResponse(res, 400, false, 'Room is full');
    }

    // Check student exists
    const student = await Student.findByPk(student_id, { transaction: t });
    if (!student) {
      await t.rollback();
      return sendResponse(res, 404, false, 'Student not found');
    }

    // Check if student already has active allocation
    const existingAllocation = await Allocation.findOne({
      where: { student_id, status: 'active' },
      transaction: t,
    });

    if (existingAllocation) {
      await t.rollback();
      return sendResponse(res, 400, false,
        'Student already has an active room allocation');
    }

    // Create allocation
    const allocation = await Allocation.create({
      student_id,
      room_id,
      allocated_at: allocated_at || new Date(),
      status: 'active',
    }, { transaction: t });

    // Update room occupancy
    const newOccupied = room.occupied + 1;
    await room.update({
      occupied: newOccupied,
      status: newOccupied >= room.capacity ? 'full' : 'available',
    }, { transaction: t });

    // Update student room_no
    await student.update({
      room_no: room.room_number,
    }, { transaction: t });

    await t.commit();

    return sendResponse(res, 201, true, 'Room allocated successfully', {
      allocation,
      room: await Room.findByPk(room_id),
      student: await Student.findByPk(student_id),
    });

  } catch (error) {
    await t.rollback();
    console.error('Allocate room error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── DEALLOCATE ROOM ───────────────────────────
const deallocateRoom = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { student_id } = req.body;

    const allocation = await Allocation.findOne({
      where: { student_id, status: 'active' },
      transaction: t,
    });

    if (!allocation) {
      await t.rollback();
      return sendResponse(res, 404, false, 'No active allocation found');
    }

    const room = await Room.findByPk(allocation.room_id, { transaction: t });
    const student = await Student.findByPk(student_id, { transaction: t });

    // Mark allocation as vacated
    await allocation.update({
      status: 'vacated',
      vacated_at: new Date(),
    }, { transaction: t });

    // Update room occupancy
    const newOccupied = Math.max(0, room.occupied - 1);
    await room.update({
      occupied: newOccupied,
      status: newOccupied >= room.capacity ? 'full' : 'available',
    }, { transaction: t });

    // Clear student room_no
    await student.update({ room_no: null }, { transaction: t });

    await t.commit();

    return sendResponse(res, 200, true, 'Room deallocated successfully');
  } catch (error) {
    await t.rollback();
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── CHANGE ROOM ────────────────────────────────
const changeRoom = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { student_id, new_room_id, allocated_at } = req.body;

    if (!student_id || !new_room_id) {
      await t.rollback();
      return sendResponse(res, 400, false,
        'Student ID and new room ID are required');
    }

    // Find student and their current active allocation
    const student = await Student.findByPk(student_id, { transaction: t });
    if (!student) {
      await t.rollback();
      return sendResponse(res, 404, false, 'Student not found');
    }

    const currentAllocation = await Allocation.findOne({
      where: { student_id: student_id, status: 'active' },
      transaction: t,
    });

    if (!currentAllocation) {
      await t.rollback();
      return sendResponse(res, 400, false,
        'Student does not have an active room allocation');
    }

    // Find old room and new room
    const oldRoom = await Room.findByPk(currentAllocation.room_id, { transaction: t });
    const newRoom = await Room.findByPk(new_room_id, { transaction: t });

    if (!oldRoom || !newRoom) {
      await t.rollback();
      return sendResponse(res, 404, false, 'Room not found');
    }

    if (newRoom.occupied >= newRoom.capacity) {
      await t.rollback();
      return sendResponse(res, 400, false, 'New room is already full');
    }

    // Mark old allocation as vacated
    await currentAllocation.update({
      status: 'vacated',
      vacated_at: new Date(),
    }, { transaction: t });

    // Create new allocation
    const newAllocation = await Allocation.create({
      student_id: student_id,
      room_id: new_room_id,
      allocated_at: allocated_at || new Date(),
      status: 'active',
    }, { transaction: t });

    // Update old room occupancy
    const oldRoomOccupied = Math.max(0, oldRoom.occupied - 1);
    await oldRoom.update({
      occupied: oldRoomOccupied,
      status: oldRoomOccupied >= oldRoom.capacity ? 'full' : 'available',
    }, { transaction: t });

    // Update new room occupancy
    const newRoomOccupied = newRoom.occupied + 1;
    await newRoom.update({
      occupied: newRoomOccupied,
      status: newRoomOccupied >= newRoom.capacity ? 'full' : 'available',
    }, { transaction: t });

    // Update student's room_no
    await student.update({ room_no: newRoom.room_number }, { transaction: t });

    await t.commit();

    return sendResponse(res, 200, true, 'Room changed successfully!', {
      allocation: newAllocation,
      student: await Student.findByPk(student_id),
      oldRoom: await Room.findByPk(oldRoom.id),
      newRoom: await Room.findByPk(newRoom.id),
    });
  } catch (error) {
    await t.rollback();
    console.error('Change room error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── INTERCHANGE ROOMS ─────────────────────────
const interchangeRoom = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { student1_id, student2_id } = req.body;

    if (!student1_id || !student2_id) {
      await t.rollback();
      return sendResponse(res, 400, false,
        'Both student IDs are required for interchange');
    }

    // Find students and their active allocations
    const student1 = await Student.findByPk(student1_id, { transaction: t });
    const student2 = await Student.findByPk(student2_id, { transaction: t });

    if (!student1 || !student2) {
      await t.rollback();
      return sendResponse(res, 404, false, 'One or both students not found');
    }

    const allocation1 = await Allocation.findOne({
      where: { student_id: student1_id, status: 'active' },
      transaction: t,
    });

    const allocation2 = await Allocation.findOne({
      where: { student_id: student2_id, status: 'active' },
      transaction: t,
    });

    if (!allocation1 || !allocation2) {
      await t.rollback();
      return sendResponse(res, 400, false,
        'One or both students do not have an active room allocation');
    }

    // Find both rooms
    const room1 = await Room.findByPk(allocation1.room_id, { transaction: t });
    const room2 = await Room.findByPk(allocation2.room_id, { transaction: t });

    // Check room capacities after interchange
    const newRoom1Occupied = room1.occupied - 1 + 1; // same as original
    const newRoom2Occupied = room2.occupied - 1 + 1; // same as original

    // Update allocations
    await allocation1.update({ room_id: room2.id }, { transaction: t });
    await allocation2.update({ room_id: room1.id }, { transaction: t });

    // Update students' room_no
    await student1.update({ room_no: room2.room_number }, { transaction: t });
    await student2.update({ room_no: room1.room_number }, { transaction: t });

    // No need to change room occupancy since it's a 1-for-1 swap
    await t.commit();

    return sendResponse(res, 200, true, 'Rooms interchanged successfully!', {
      student1: await Student.findByPk(student1_id),
      student2: await Student.findByPk(student2_id),
      room1: await Room.findByPk(room1.id),
      room2: await Room.findByPk(room2.id),
    });

  } catch (error) {
    await t.rollback();
    console.error('Interchange room error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

module.exports = {
  getAllRooms,
  getAvailableRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  allocateRoom,
  deallocateRoom,
  changeRoom,
  interchangeRoom,
};