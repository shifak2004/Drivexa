const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in backend/.env');
    }

    const dbName = process.env.MONGODB_DB_NAME || 'drivexa';
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Start MongoDB or update backend/.env MONGODB_URI, then restart the backend.');
    process.exit(1);
  }
};

module.exports = connectDB;

