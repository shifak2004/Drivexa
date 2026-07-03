const getEntityId = (entity) => {
  if (!entity) return null;
  if (typeof entity === 'string') return entity;
  return (entity._id || entity.id || entity).toString();
};

const getRidePayload = (data = {}) => data.ride || data.rideData || null;

const initializeSocket = (io) => {
  const connectedUsers = new Map();

  const emitToUser = (userId, event, payload) => {
    const normalizedUserId = getEntityId(userId);
    const socketId = connectedUsers.get(normalizedUserId);
    if (socketId) {
      io.to(socketId).emit(event, payload);
      return true;
    }
    return false;
  };

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join', (userId) => {
      const normalizedUserId = getEntityId(userId);
      if (!normalizedUserId) return;

      connectedUsers.set(normalizedUserId, socket.id);
      socket.join(normalizedUserId);
      console.log(`User ${normalizedUserId} joined with socket ${socket.id}`);
    });

    socket.on('new-ride-request', (rideData) => {
      console.log('New ride request:', rideData);
      socket.broadcast.emit('new-ride-request', rideData);
    });

    socket.on('ride-accepted', (data = {}) => {
      const ride = getRidePayload(data);
      const riderId = data.riderId || getEntityId(ride?.rider);
      const payload = { ride, rideData: ride, status: ride?.status || 'accepted' };

      emitToUser(riderId, 'ride-accepted', payload);
      socket.broadcast.emit('ride-status-update', payload);
    });

    socket.on('ride-status-update', (data = {}) => {
      const ride = getRidePayload(data);
      const status = data.status || ride?.status;
      const riderId = data.riderId || getEntityId(ride?.rider);
      const payload = {
        ride,
        rideData: ride,
        rideId: data.rideId || ride?._id || ride?.id,
        status,
      };

      if (riderId) {
        emitToUser(riderId, 'ride-status-update', payload);
      }
      socket.broadcast.emit('ride-status-update', payload);
    });

    socket.on('driver-location-update', (data = {}) => {
      const coordinates = data.coordinates || data.location?.coordinates || data.location;
      const payload = {
        driverId: getEntityId(data.driverId),
        coordinates,
        location: data.location || { type: 'Point', coordinates },
      };

      if (data.riderId) {
        emitToUser(data.riderId, 'driver-location-update', payload);
      } else {
        socket.broadcast.emit('driver-location-update', payload);
      }
    });

    socket.on('driver-online', (driverData) => {
      socket.broadcast.emit('driver-online', driverData);
      console.log(`Driver ${driverData?.driverId} is now online`);
    });

    socket.on('driver-offline', (driverData) => {
      socket.broadcast.emit('driver-offline', driverData);
      console.log(`Driver ${driverData?.driverId} is now offline`);
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initializeSocket;
