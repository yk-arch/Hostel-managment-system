const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/database');

// ─── IMPORT ALL MODELS FIRST ──────────────────
// Sequelize needs ALL models imported before sync
// so it knows which tables to create
const User = require('./models/userModel');
const Student = require('./models/studentModel');
const Room = require('./models/roomModel');
const Allocation = require('./models/allocationModel');
const Fee = require('./models/feeModel');
const Laundry = require('./models/laundryModel');
const Complaint = require('./models/complaintModel');
const Expenditure = require('./models/expenditureModel');
const Notification = require('./models/notificationModel');

// ─── IMPORT ALL ROUTES ────────────────────────
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const roomRoutes = require('./routes/roomRoutes');
const feeRoutes = require('./routes/feeRoutes');
const laundryRoutes = require('./routes/laundryRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const expenditureRoutes =
  require('./routes/expenditureRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// ─── DEFINE ALL ASSOCIATIONS ──────────────────
// This tells Sequelize how tables relate to each other
// Must be done AFTER model imports, BEFORE sync

// Fee → Student
Fee.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student',
});
Student.hasMany(Fee, {
  foreignKey: 'student_id',
  as: 'fees',
});

// Allocation → Student
Allocation.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student',
});
Student.hasMany(Allocation, {
  foreignKey: 'student_id',
  as: 'allocations',
});

// Allocation → Room
Allocation.belongsTo(Room, {
  foreignKey: 'room_id',
  as: 'room',
});
Room.hasMany(Allocation, {
  foreignKey: 'room_id',
  as: 'allocations',
});

// Room ↔ Student (many-to-many through Allocation)
Room.belongsToMany(Student, {
  through: Allocation,
  foreignKey: 'room_id',
  otherKey: 'student_id',
  as: 'students',
});
Student.belongsToMany(Room, {
  through: Allocation,
  foreignKey: 'student_id',
  otherKey: 'room_id',
  as: 'rooms',
});

// Laundry → Student
Laundry.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student',
});
Student.hasMany(Laundry, {
  foreignKey: 'student_id',
  as: 'laundry',
});

// Complaint → Student
Complaint.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student',
});
Student.hasMany(Complaint, {
  foreignKey: 'student_id',
  as: 'complaints',
});

// ─── EXPRESS APP SETUP ────────────────────────
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── MOUNT ALL ROUTES ─────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/laundry', laundryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── HEALTH CHECK ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: true,
    message: '🏨 Hostel Backend Running!',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL Connected',
    modules: [
      'auth', 'students', 'rooms', 'fees',
      'laundry', 'complaints', 'expenditures'
    ],
  });
});

// ─── 404 HANDLER ──────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    status: false,
    message: `Route ${req.originalUrl} not found`,
    data: null,
  });
});

// ─── START SERVER ─────────────────────────────
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Step 1: Connect to database
  await connectDB();

  // Step 2: Sync ALL models
  // alter: true → updates existing tables safely
  // This will CREATE any missing tables automatically
  await sequelize.sync({ alter: true });
  console.log('✅ All tables synced to PostgreSQL');
  console.log('   Tables: users, students, rooms,');
  console.log('   allocations, fees, laundry,');
  console.log('   complaints, expenditures');

  // Step 3: Start listening
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Server → http://localhost:${PORT}`);
    console.log(`✅ Health → http://localhost:${PORT}/api/health`);
    console.log(`📱 Flutter → http://YOUR_IP:${PORT}/api\n`);
  });
};

startServer();