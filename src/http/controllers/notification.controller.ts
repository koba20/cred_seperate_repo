import { NextFunction, Response } from "express";

import AppException from "../../exceptions/AppException";
import EmailService from "../../services/Email.service";
import HelperClass from "../../utils/helper";
import NotificationService from "../../services/Notification.service";
import { RequestType } from "../middlewares/auth.middleware";
import Notifier from "../../services/sendchamp";
import User from "../../database/models/User.model";
import UserService from "../../services/User.service";
import httpStatus from "http-status";
import pick from "../../utils/pick";
import { uploadBase64File } from "../../services/File.service";

const notifier = new Notifier();

export default class NotificationController {
  constructor(
    private readonly emailService: EmailService,
    private readonly userService: UserService
  ) {}

  async sendNotifications(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = {};
      req.body.notify.length === 0
        ? null
        : Object.assign(filter, {
            _id: { $in: req.body.notifyUsers },
          });
      const users = (await this.userService.getAllUsers(
        filter,
        {},
        true
      )) as User[];

      if (users.length === 0) throw new Error("No users found to notify");

      users.map(async (user) => {
        await this.emailService.notifyStationUsersOfNotification(
          user.email,
          `${user.firstName} ${user.lastName}`,
          req.body.message
        );
        const meta: { url: string; publicId: string }[] = [];
        if (req.body.attachments.length > 0) {
          req.body.attachments.forEach(async (attachment: string) => {
            const publicId = HelperClass.generateRandomChar(10);
            const uploadAttachment = await uploadBase64File(
              attachment,
              "notification",
              publicId
            );
            meta.push({ url: uploadAttachment.secure_url, publicId });
          });
        }
        await NotificationService.createNotification({
          body: req.body.message,
          title: req.body.title,
          meta: req.body.attachments ? meta : null,
          user: user.id,
          type: req.body.type,
        });
      });

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Notifications sent successfully",
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getNotifications(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = pick(req.query, ["user", "type"]);
      const options = pick(req.query, ["orderBy", "limit", "page", "populate"]);
      const data = await NotificationService.getAllNotifications(
        filter,
        options
      );
      return res.status(httpStatus.OK).json({
        status: "success",
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async sendBulkSms(req: RequestType, res: Response, next: NextFunction) {
    try {
      if (req.body.notify.length === 0)
        throw new Error("No users found to notify");

      const options = {
        route: "dnd" as const,
        to: req.body.notify as string[],
        message: req.body.message as string,
        sender_name: "Sendchamp",
      };

      await notifier.sms.send(options);
      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Sms sent successfully",
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }
}
