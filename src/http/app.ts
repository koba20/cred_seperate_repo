import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import enforce from "express-sslify";
import router from "./router/v1/router.module";
import {
  ErrorHandler,
  ErrorConverter,
} from "./middlewares/error_handler.middleware";
import morgan from "morgan";
import hpp from "hpp";
//import rateLimit from "express-rate-limit";
import helmet from "helmet";
import AppException from "../exceptions/AppException";
import httpStatus from "http-status";
import config from "../../config/config";
import { WHITE_LIST_ORIGIN } from "../../config/constants";
// import rateLimit from "express-rate-limit";
// import HelperClass from "../utils/helper";

const app: Application = express();

if (config.env === "production" || config.env === "staging") {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

if (config.env === "development") {
  app.use(morgan("dev"));
}

const coresOption = {
  origin: WHITE_LIST_ORIGIN,
  credentials: true,
};

app.use(express.json({ limit: "2MB" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors(coresOption));
app.use(hpp());
app.use(helmet());
if (config.environment === "production") {
  app.set('trust proxy', true);
  
  // limit request 
  // const limiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 20, // limit each IP to 100 requests per windowMs
  //   skipSuccessfulRequests: true,
  //   keyGenerator: (req) => HelperClass. getClientIP(req), // Use the custom function to get the IP
  //   message: "Too many requests from this IP, please try again in an 15mins!",
  // });
  // app.use("/api", limiter);
}
app.disable("x-powered-by");

app.get("/", (_req, res) => {
  res.send(`<b>Welcome to ${config.appName} App!</b>`);
});

app.use("/api/v1", router);

app.all("*", (req: Request, _res: Response, next: NextFunction) => {
  return next(
    new AppException(
      `Cant find ${req.originalUrl} on the server.`,
      httpStatus.NOT_FOUND
    )
  );
});

app.use(ErrorConverter);
app.use(ErrorHandler);
export default app;
