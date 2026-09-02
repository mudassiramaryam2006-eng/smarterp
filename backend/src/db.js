const mongoose = require('mongoose');

let connected = false;

async function connectDB() {
  if (connected) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
  }

  await mongoose.connect(uri);
  connected = true;
  console.log('Connected to MongoDB Atlas');
  return mongoose.connection;
}

module.exports = { connectDB };
