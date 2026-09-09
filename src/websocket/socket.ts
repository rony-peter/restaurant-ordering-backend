import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

export interface SocketUser {
  id: string;
  email: string;
  role: string;
  restaurantId: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

let io: Server | null = null;

export function initSocket(server: HTTPServer): Server {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust to match your frontend origin in production
      methods: ["GET", "POST"],
    },
  });

  // JWT Authentication Middleware for Sockets
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error("Server misconfiguration: Missing JWT secret"));
      }

      const decoded = jwt.verify(token, jwtSecret) as SocketUser;
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const restaurantId = socket.user?.restaurantId;

    if (restaurantId) {
      // Automatically join client to their restaurant's private room
      const roomName = `restaurant_${restaurantId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} (User: ${socket.user?.email}) joined room: ${roomName}`);
    }

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Helper to access the Socket.IO instance anywhere in services/controllers
export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
}

// Helper function to emit events strictly to a specific restaurant room
export function emitToRestaurant(restaurantId: string, event: string, payload: any) {
  if (io) {
    io.to(`restaurant_${restaurantId}`).emit(event, payload);
  }
}