import mongoose from "mongoose";
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { User } from "../..";
import RedisClient from "./redis";
import { WS_EVENT } from "../../config/constants";
import UserService from "../services/User.service";
import config from "../../config/config";
// import { userController } from "../http/controllers/controllers.module";

// init user service
const userService = new UserService();

export default class WS {
  public static instance: WS;
  private io: Server;
  private redis: RedisClient = new RedisClient(config.redis.url);
  private User: string;

  private constructor(io: Server) {
    this.io = io;
    this.setupSocket();
  }

  public static getInstance(io: Server): WS {
    if (!this.instance) {
      this.instance = new WS(io);
    }
    return this.instance;
  }

  private setupSocket() {
    this.io.on(
      WS_EVENT.CONNECTION,
      async (socket: Socket<DefaultEventsMap>) => {
        const { User } = socket.handshake.query;
        const user_previous_socket = await this.redis.getUserSocket(
          User as string
        );

        this.User = User as string;

        if (user_previous_socket) {
          await this.redis.delete(User as string);
        }

        await this.redis.set(this.User as string, socket.id);
        this.setupEventHandlers(socket);
        socket.emit(WS_EVENT.CONNECTED, { message: "Connected to socket" });
        socket.on(WS_EVENT.DISCONNECTED, async () => {
          socket.emit(`${socket.id} disconnected`);
          const { User } = socket.handshake.query;
          await this.redis.delete(User as string);
          socket.disconnect();
        });
      }
    );
  }

  public setupEventHandlers(socket: Socket) {
    socket.on(WS_EVENT.JOIN, (room) => {
      console.log("user just joined", room);
      socket.join(room);
    });
  }
  async emitEventToClient(User: string, event: string, data: any) {
    const socketId = await this.redis.getUserSocket(User);
    if (socketId) {
      this.io.sockets.sockets.get(socketId)?.emit(event, data);
    }
  }
  emitEventToAll(event: string, data: any) {
    this.io.sockets.emit(event, data);
  }
  emitEventTo(event: string, data: any) {
    this.io.emit(event, data);
  }
}

export async function socketUserMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {
    let { user } = socket.handshake.query;
    user = user as string;
    if (!user) throw new Error("Oops!, user must be provided");

    if (!mongoose.Types.ObjectId.isValid(user))
      throw new Error("invalid Id format ");
    let user_details: User;

    user_details = await userService.getUserById(user);
    if (!user_details) throw new Error("Oops!, Patient not found");

    socket.handshake.query.User = user_details.id;
    next();
  } catch (error) {
    if (error instanceof Error) {
      next(error);
    }
  }
}
