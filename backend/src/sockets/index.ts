import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export default function setupSockets(io: Server) {
  // Middleware to authenticate socket connections
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    console.log(`[Mashi] User connected: ${user._id} (${user.role})`);

    // Join a personal room based on user ID
    socket.join(user._id.toString());

    // Driver joins their zone room for targeted dispatch
    if (user.role === 'driver' && user.currentZone) {
      socket.join(`zone_${user.currentZone.toString()}`);
    }

    // Driver location update
    socket.on('driver:location_update', async (data: { lat: number, lng: number }) => {
      if (user.role === 'driver') {
        await User.findByIdAndUpdate(user._id, {
          location: { type: 'Point', coordinates: [data.lng, data.lat] },
          isOnline: true
        });
      }
    });

    // Driver zone update
    socket.on('driver:zone_update', async (data: { zoneId: string }) => {
      if (user.role === 'driver') {
        // Leave old zone room
        if (user.currentZone) {
          socket.leave(`zone_${user.currentZone.toString()}`);
        }
        // Join new zone room
        socket.join(`zone_${data.zoneId}`);
        await User.findByIdAndUpdate(user._id, { currentZone: data.zoneId });
        user.currentZone = data.zoneId;
      }
    });

    // Driver status change (online/offline)
    socket.on('driver:status_change', async (data: { isOnline: boolean }) => {
       if (user.role === 'driver') {
         // Check wallet balance before going online
         const driver = await User.findById(user._id);
         if (data.isOnline && driver && driver.walletBalance <= 0) {
           socket.emit('driver:blocked', { message: 'Insufficient wallet balance' });
           return;
         }
         await User.findByIdAndUpdate(user._id, { isOnline: data.isOnline });
         socket.emit('driver:status_confirmed', { isOnline: data.isOnline });
       }
    });

    // Trip room management
    socket.on('trip:join_room', (tripId: string) => {
      socket.join(`trip_${tripId}`);
      console.log(`[Mashi] User ${user._id} joined trip room trip_${tripId}`);
    });

    // Trip dispatch to specific driver
    socket.on('trip:dispatch', (data: { driverId: string, tripId: string, tripData: any }) => {
      io.to(data.driverId).emit('trip:incoming_request', {
        tripId: data.tripId,
        ...data.tripData,
      });
    });

    // Trip status change broadcast
    socket.on('trip:status_change', (data: { tripId: string, status: string }) => {
      io.to(`trip_${data.tripId}`).emit('trip:status_updated', data);
    });

    // Driver response to dispatch
    socket.on('trip:driver_response', (data: { tripId: string, response: 'accepted' | 'rejected' }) => {
      io.to(`trip_${data.tripId}`).emit('trip:driver_responded', {
        driverId: user._id,
        response: data.response,
      });
    });

    socket.on('disconnect', async () => {
      console.log(`[Mashi] User disconnected: ${user._id}`);
      if (user.role === 'driver') {
         await User.findByIdAndUpdate(user._id, { isOnline: false });
      }
    });
  });
}
