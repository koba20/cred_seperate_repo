/* eslint-disable @typescript-eslint/no-explicit-any */
import app from "./src/http/app";
import config from "./config/config";
import connectDb from "./src/database/connect";
import RepaymentJob from "./src/services/jobs/repayment.jobs";
import http from "http";
import { Server } from "socket.io";
import WS, { socketUserMiddleware } from "./src/utils/ws.config";
import RedisClient from "./src/utils/redis";

const port: number = +config.port || 8080;

connectDb();

const server = http.createServer(app);
const io = new Server(server);

io.use(socketUserMiddleware);

WS.getInstance(io);
RedisClient.getInstance(config.redis.url);

// Handle server errors
server.on("error", (error) => {
  console.log("Server error:", error);
});

server.listen(port, () => {
  console.log(`App is running on port ${port}`);
});

// init jobs
RepaymentJob();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.error("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

// pushTOdb();
const unexpectedErrorHandler = (error: any) => {
  console.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  console.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
