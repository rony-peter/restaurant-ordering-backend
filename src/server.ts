import { createServer } from "node:http";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { initSocket } from "./websocket/socket.js";

const httpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(
    `Restaurant Ordering API running on http://localhost:${env.PORT}`
  );
});