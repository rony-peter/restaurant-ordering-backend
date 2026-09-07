import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server | null = null;

interface TokenPayload {
  userId: string;
  restaurantId: string;
  role: string;
}

export function initSocket(server: HTTPServer): Server {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust origins in production
      methods: ["GET", "POST"],
    },
  });

  // Middleware: Authenticate socket connections using JWT query or auth token
  io.use((socket: Socket, next) => {
    const token =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.query?.token as string);

    if (!token) {
      // Unauthenticated customer connections are permitted
      return next();
    }

    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      const decoded = jwt.verify(token, secret) as TokenPayload;
      socket.data.user = decoded;

      // Automatically join staff sockets to their restaurant room
      if (decoded.restaurantId) {
        socket.join(`restaurant_${decoded.restaurantId}`);
      }

      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Allow staff sockets to manually join kitchen channels if needed
    socket.on("join:restaurant", (restaurantId: string) => {
      socket.join(`restaurant_${restaurantId}`);
    });

    // Customer sockets join room for tracking a specific order
    socket.on("joinOrderRoom", (orderId: string) => {
      socket.join(`order_${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
}