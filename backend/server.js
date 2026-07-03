const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initializeSocket = require('./socket/socketHandler');

// Import routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const driverRoutes = require('./routes/drivers');
const ratingRoutes = require('./routes/ratings');

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON body
app.use(express.json());

// Connect to MongoDB
connectDB();

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/ratings', ratingRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Drivexa API is running' });
});

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO with same CORS config
const io = new Server(server, {
  cors: corsOptions,
});

// Initialize socket handler
initializeSocket(io);

// Listen on PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Drivexa server running on port ${PORT}`);
});
