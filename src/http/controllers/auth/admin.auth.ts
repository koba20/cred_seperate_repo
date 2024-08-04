/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import AppException from "../../../exceptions/AppException";
import httpStatus from "http-status";
import HelperClass from "../../../utils/helper";
import config from "../../../../config/config";
import moment from "moment";
import AuthService from "../../../services/Auth.service";
import EncryptionService from "../../../services/Encryption.service";
import TokenMustStillBeValid from "./rules/TokenMustStillBeValid";
import { ACCOUNT_STATUS } from "../../../../config/constants";
import AdminService from "../../../services/Admin.service";
import Admin from "../../../database/models/Admin.model";
import PaymentService from "../../../services/payment.service";
import { createHash } from "crypto";
import { SendOtpConfig } from "../../../..";
import Notifier from "../../../services/sendchamp";

export default class AdminAuth {
  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
    private readonly encryptionService: EncryptionService,
    private readonly paymentService: PaymentService
  ) {}


  async create(req: Request, res: Response, next: NextFunction) {
    console.log(this.paymentService);

    try {
      req.body.phoneNumber = req.body.phoneNumber.startsWith("+234")
        ? req.body.phoneNumber
        : `+234${req.body.phoneNumber.replace(/^0+/, "")}`;

      const emailTaken = await this.adminService.getAdminDetail({
        email: req.body.email,
      });
      delete req.body.confirmPassword;
      const phoneNumberTaken = await this.adminService.getAdminDetail({
        phoneNumber: req.body.phoneNumber,
      });
      if (emailTaken) throw new Error(`Oops!, ${emailTaken.email} is taken`);
      if (phoneNumberTaken)
        throw new Error(`Oops!, ${phoneNumberTaken.phoneNumber} is taken`);
      // req.body.role = ADMIN_ROLE.ENGINEER;
      req.body.firstName = HelperClass.titleCase(req.body.firstName);
      req.body.lastName = HelperClass.titleCase(req.body.lastName);
      req.body.referralCode = HelperClass.generateRandomChar(4, "upper-num");
      req.body.accountStatus = { status: ACCOUNT_STATUS.PENDING };
      /** if admin does not exist create the admin using the admin service */
      req.body.password = await this.encryptionService.hashPassword(
        req.body.password
      );
      const OTP_CODE = HelperClass.generateRandomChar(4, "num");
      const hashedToken = createHash("sha512")
        .update(String(OTP_CODE))
        .digest("hex");

      req.body.verificationToken = hashedToken;
      req.body.verificationTokenExpiry = moment()
        .add("1", "day")
        .utc()
        .toDate();

      const data = await this.authService.create<Admin>(req.body, Admin);
      /** Setup admin wallet */
      // await this.paymentService.setupAccount<Admin>(data, {});

      const _email: SendOtpConfig = {
        channel: "email",
        sender: "CredX",
        token_type: "numeric",
        token_length: 4,
        expiration_time: 10,
        customer_email_address: data.email,
        customer_mobile_number: "",
        token: OTP_CODE,
      };

      await new Notifier().verification.sendOTP(_email);

      const _sms: SendOtpConfig = {
        ..._email,
        channel: "sms",
        customer_email_address: "",
        customer_mobile_number: data.phoneNumber,
      };

      await new Notifier().verification.sendOTP(_sms);

      return res.status(httpStatus.OK).json({
        status: "success",
        message: `We've sent an verification email to your mail`,
        admin: data,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const adminExists = await Admin.findOne({
        email: req.body.email,
      }).select("+password");

      if (
        !adminExists ||
        !(await this.encryptionService.comparePassword(
          adminExists.password,
          req.body.password
        ))
      )
        throw new Error(`Oops!, invalid email or password`);

      if (adminExists.accountStatus.status !== ACCOUNT_STATUS.ACTIVATED)
        throw Error(
          "Oops! you cant login, Please.. you must Verify your account to login."
        );
      const token = await this.authService.login(adminExists as any);

      return res
        .status(httpStatus.ACCEPTED)
        .json({ admin: adminExists, token });
    } catch (err: unknown) {
      if (err instanceof AppException || err instanceof Error) {
        console.error(err);
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async regenerateAccessToken(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = await this.authService.regenerateAccessToken<Admin>(
        req.body.refreshToken,
        Admin
      );
      if (!accessToken || accessToken.trim() === "")
        return next(
          new AppException("Oops! Refresh token expired.", httpStatus.FORBIDDEN)
        );

      return res.status(httpStatus.OK).json({ status: "success", accessToken });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = await this.adminService.getAdminDetail({
        email: req.body.email,
      });
      if (!admin)
        next(
          new AppException("Oops!, admin does not exist", httpStatus.NOT_FOUND)
        );
      if (admin.isEmailVerified === true)
        new Error(`Oops!, email has already been verified`);

      await this.authService.resendOtp<Admin>(admin as any, Admin);
      return res.status(httpStatus.NO_CONTENT).send();
    } catch (err: any) {
      return next(
        new AppException(err.status, err.message || httpStatus.FORBIDDEN)
      );
    }
  }

  async passwordReset(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.body.modeOfReset === "email") {
        await this.sendResetPasswordEmail(req.body.email);
        res.status(httpStatus.NO_CONTENT).send();
      }
      if (req.body.modeOfReset === "phoneNumber") {
        await this.sendadminPasswordResetOTP(req, res, next);
      }
    } catch (error: any) {
      return next(new AppException(error.message, error.status));
    }
  }

  async sendResetPasswordEmail(email: string) {
    const adminExists = await this.adminService.getAdminDetail({
      email,
    });
    if (!adminExists) throw new Error(`Oops! admin does not exist`);

    const token = HelperClass.generateRandomChar(4, "num");
    const hashedToken = await this.encryptionService.hashString(token);

    const updateBody: Pick<Admin, "resetToken" | "resetTokenExpiresAt"> = {
      resetToken: hashedToken,
      resetTokenExpiresAt: moment().add(12, "hours").utc().toDate(),
    };

    await this.adminService.updateAdminById(adminExists.id, updateBody);

    const _email: SendOtpConfig = {
      channel: "email",
      sender: "CredX",
      token_type: "numeric",
      token_length: 4,
      expiration_time: 10,
      customer_email_address: adminExists.email,
      customer_mobile_number: "",
      token: token,
    };

    await new Notifier().verification.sendOTP(_email);
  }

  async sendadminPasswordResetOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      req.body.phoneNumber = req.body.phoneNumber.startsWith("+234")
        ? req.body.phoneNumber
        : `+234${req.body.phoneNumber.replace(/^0+/, "")}`;
      const adminExists = await this.adminService.getAdminDetail({
        phoneNumber: req.body.phoneNumber,
      });
      if (!adminExists)
        return next(
          new AppException("Oops! admin does not exist", httpStatus.NOT_FOUND)
        );
      const otp = HelperClass.generateRandomChar(4, "num");
      if (config.environment === "production") {
        return res.status(httpStatus.OK).json({
          status: "smsSent.data.status",
          message: "OTP sent successfully",
        });
      }
      const hashedToken = await this.encryptionService.hashString(otp);

      const updateBody: Pick<Admin, "resetToken" | "resetTokenExpiresAt"> = {
        resetToken: hashedToken,
        resetTokenExpiresAt: moment().add(12, "hours").utc().toDate(),
      };

      await this.adminService.updateAdminById(adminExists.id, updateBody);
      return res.status(httpStatus.OK).json({
        status: "success",
        data: {
          message:
            "For testing purposes, OTP wont be sent to your phone number, below is the OTP for resetting password",
          token: otp,
        },
      });
    } catch (err: any) {
      return next(new AppException(err.message, err.status));
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const hashedToken = await this.encryptionService.hashString(
        req.body.token
      );

      const admin: Admin = await this.adminService.getAdminDetail({
        resetToken: hashedToken,
      });

      if (!admin) return TokenMustStillBeValid(next);
      if (admin.resetTokenExpiresAt < moment().utc().toDate())
        throw new Error(`Oops!, your token has expired`);
      const hashedPassword = await this.encryptionService.hashPassword(
        req.body.password
      );

      const updateBody: Pick<
        Admin,
        "password" | "resetToken" | "resetTokenExpiresAt"
      > = {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      };

      await this.adminService.updateAdminById(admin.id, updateBody);

      res.status(httpStatus.OK).json({
        status: "success",
        message: "Password reset was successful",
      });
    } catch (err: any) {
      return next(new AppException(err.message, err.status));
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      /**
       * Check if the hashed token sent to the admin has not being tampered with
       * Check if the token is the same with the one stores in the database
       * check if the email has not being verified
       * check if the token has expired
       * set verificationToken and verificationTokenExpiry field to null
       */

      const _hashedEmailToken: string = await this.encryptionService.hashString(
        req.body.otp
      );

      const admin = await this.adminService.getAdminDetail({
        isEmailVerified: false,
        verificationToken: _hashedEmailToken,
      });

      if (!admin) return TokenMustStillBeValid(next);
      if (
        admin.verificationTokenExpiry < moment().utc().startOf("day").toDate()
      )
        throw new Error(`Oops!, your token has expired`);

      const data: Pick<
        Admin,
        | "emailVerifiedAt"
        | "isEmailVerified"
        | "verificationToken"
        | "verificationTokenExpiry"
      > = {
        isEmailVerified: true,
        emailVerifiedAt: moment().utc().toDate(),
        verificationToken: null,
        verificationTokenExpiry: null,
      };
      Object.assign(data, {
        accountStatus: { status: ACCOUNT_STATUS.ACTIVATED },
      });
      await this.adminService.updateAdminById(admin.id, data);

      return res.status(httpStatus.OK).json({
        status: `success`,
        message: `Your email: ${admin.email} has been verified`,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }
}
