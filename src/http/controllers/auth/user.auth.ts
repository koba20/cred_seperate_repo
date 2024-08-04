/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

import { ACCOUNT_STATUS } from "../../../../config/constants";
import AppException from "../../../exceptions/AppException";
import AuthService from "../../../services/Auth.service";
import EncryptionService from "../../../services/Encryption.service";
import HelperClass from "../../../utils/helper";
import TokenMustStillBeValid from "./rules/TokenMustStillBeValid";
import User from "../../../database/models/User.model";
import UserService from "../../../services/User.service";
import httpStatus from "http-status";
import moment from "moment";
import pick from "../../../utils/pick";
import Notifier from "../../../services/sendchamp";
import { SendOtpConfig } from "../../../..";

export default class UserAuth {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async checkUser(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = pick(req.query, ["email", "phoneNumber", "username"]);
      const phoneNumber = req.query.phoneNumber as string;
      "phoneNumber" in filter && phoneNumber.startsWith("+234")
        ? filter.phoneNumber
        : `+234${phoneNumber.replace(/^0+/, "")}`;
      const user = await User.findOne({
        $or: [
          { email: req.query.email },
          { phoneNumber: req.query.phoneNumber },
          { username: req.query.username },
        ],
      });
      res.status(httpStatus.OK).json({
        status: "success",
        ...("email" in filter && user && user.email === filter.email
          ? { isEmailTaken: true }
          : { isEmailTaken: false }),
        ...("phoneNumber" in filter && user && user.phoneNumber === phoneNumber
          ? { isPhoneNumberTaken: true }
          : { isPhoneNumberTaken: false }),
        ...("username" in filter && user && user.username === filter.username
          ? { isUsernameTaken: true }
          : { isUsernameTaken: false }),
      });
    } catch (error: any) {
      return next(new AppException(error.message, error.status));
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      req.body.phoneNumber = req.body.phoneNumber.startsWith("+234")
        ? req.body.phoneNumber
        : `+234${req.body.phoneNumber.replace(/^0+/, "")}`;

      const phoneNumberTaken = await this.userService.getUserDetail({
        phoneNumber: req.body.phoneNumber,
      });

      if (phoneNumberTaken) {
        if (phoneNumberTaken.isPhoneNumberVerified) {
          throw new Error(`${req.body.phoneNumber} is already in use`);
        }
      }

      const password = await this.encryptionService.hashPassword(
        req.body.password
      );

      Object.assign(req.body, { password });
      const OTP_CODE = HelperClass.generateRandomChar(4, "num");
      const hashedToken = await this.encryptionService.hashString(OTP_CODE);

      const sms: SendOtpConfig = {
        channel: "sms",
        sender: "CredX",
        token_type: "numeric",
        token_length: 4,
        expiration_time: 10,
        customer_email_address: "",
        customer_mobile_number: req.body.phoneNumber,
        token: OTP_CODE,
      };

      await new Notifier().verification.sendOTP(sms);

      // if(otp.code == HttpStatusCode.Ok){}
      req.body.accountStatus = {
        status: ACCOUNT_STATUS.PENDING,
        reason: "Account is pending verification",
      };

      req.body.verificationToken = hashedToken;
      req.body.verificationTokenExpiry = moment()
        .add("10", "minute")
        .utc()
        .toDate();

      const data = !phoneNumberTaken
        ? await this.authService.create<User>(req.body, User)
        : await this.userService.updateUserById(phoneNumberTaken.id, req.body);

      return res.status(httpStatus.OK).json({
        status: "success",
        message: `We've sent an verification email to your phone. Your code is ${OTP_CODE}`,
        data,
      });
    } catch (error: any) {
      return next(new AppException(error.message, error.status));
    }
  }

  async verifyRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const hashedOtp = await this.encryptionService.hashString(req.body.otp);
      let _user: User = await this.userService.getUserDetail({
        verificationToken: hashedOtp,
      });

      if (!_user)
        return next(
          new AppException("Oops!, invalid otp", httpStatus.BAD_REQUEST)
        );

      if (!_user) return TokenMustStillBeValid(next);
      if (
        _user.verificationTokenExpiry < moment().utc().startOf("day").toDate()
      )
        throw new Error(`Oops!, your token has expired`);

      _user = await this.userService.updateUserById(_user.id, {
        verificationToken: null,
        verificationTokenExpiry: null,
        isPhoneNumberVerified: true,
      });

      const token = await this.authService.login(_user as any);

      return res.status(httpStatus.OK).json({
        status: "success",
        user: _user,
        token,
      });
    } catch (err: any) {
      return next(
        new AppException(err.status, err.message || httpStatus.FORBIDDEN)
      );
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      req.body.identifier = req.body.identifier.includes("@")
        ? "" /// evaluate identifier as email here
        : req.body.identifier.startsWith("+234")
        ? req.body.identifier
        : `+234${req.body.identifier.replace(/^0+/, "")}`;

      const _userExists = await User.findOne({
        $or: [
          { email: req.body.identifier },
          { phoneNumber: req.body.identifier },
        ],
      }).select("+password");

      ///
      if (
        !_userExists ||
        !(await this.encryptionService.comparePassword(
          _userExists.password,
          req.body.password
        ))
      )
        throw new Error(`Oops!, invalid phone or password`);

      if (!_userExists.isPhoneNumberVerified) {
        delete req.body.password;
        delete req.body.identifier;

        const OTP_CODE = HelperClass.generateRandomChar(4, "num");
        const hashedToken = await this.encryptionService.hashString(OTP_CODE);

        req.body.otpToken = hashedToken;
        req.body.otpTokenExpiry = moment().add("10", "minute").utc().toDate();

        const sms: SendOtpConfig = {
          channel: "sms",
          sender: "CredX",
          token_type: "numeric",
          token_length: 4,
          expiration_time: 10,
          customer_email_address: "",
          customer_mobile_number: req.body.identifier,
          token: OTP_CODE,
        };
        await new Notifier().verification.sendOTP(sms);
        await this.userService.updateUserById(_userExists.id, req.body);
        throw Error(
          `Your account is not verified. Verification token sent to ${_userExists.phoneNumber}`
        );
      }

      const token = await this.authService.login(_userExists as any);
      return res.status(httpStatus.OK).json({
        status: "success",
        user: _userExists,
        token,
      });
    } catch (err: unknown) {
      if (err instanceof AppException || err instanceof Error) {
        console.error(err);
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async passwordReset(req: Request, res: Response, next: NextFunction) {
    try {
      req.body.phoneNumber = req.body.phoneNumber.startsWith("+234")
        ? req.body.phoneNumber
        : `+234${req.body.phoneNumber.replace(/^0+/, "")}`;

      const userExist = await this.userService.getUserByPhoneNumber(
        req.body.phoneNumber
      );
      if (!userExist) throw new Error("Oops!, invalid phone number");

      const OTP_CODE = HelperClass.generateRandomChar(4, "num");
      const hashedToken = await this.encryptionService.hashString(OTP_CODE);

      const updateBody: Pick<User, "resetToken" | "resetTokenExpiresAt"> = {
        resetToken: hashedToken,
        resetTokenExpiresAt: moment().add(12, "hours").utc().toDate(),
      };

      await this.userService.updateUserById(userExist.id, req.body);

      const sms: SendOtpConfig = {
        channel: "sms",
        sender: "CredX",
        token_type: "numeric",
        token_length: 4,
        expiration_time: 10,
        customer_email_address: "",
        customer_mobile_number: req.body.phoneNumber,
        token: OTP_CODE,
      };

      await new Notifier().verification.sendOTP(sms);
      
      res.status(httpStatus.OK).json({
        status: "success",
        message: "Recover PIN sent succefully",
      });

      await this.userService.updateUserById(userExist.id, updateBody);
    } catch (error: any) {
      return next(new AppException(error.message, error.status));
    }
  }

  async sendUserPasswordResetOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      req.body.phoneNumber = req.body.phoneNumber.startsWith("+234")
        ? req.body.phoneNumber
        : `+234${req.body.phoneNumber.replace(/^0+/, "")}`;
      const userExists = await this.userService.getUserDetail({
        phoneNumber: req.body.phoneNumber,
      });
      if (!userExists)
        return next(
          new AppException("Oops! User does not exist", httpStatus.NOT_FOUND)
        );
      const otp = HelperClass.generateRandomChar(4, "num");

      const hashedToken = await this.encryptionService.hashString(otp);

      const updateBody: Pick<User, "resetToken" | "resetTokenExpiresAt"> = {
        resetToken: hashedToken,
        resetTokenExpiresAt: moment().add(12, "hours").utc().toDate(),
      };

      await this.userService.updateUserById(userExists.id, updateBody);
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

      const user: User = await this.userService.getUserDetail({
        resetToken: hashedToken,
      });

      if (!user) return TokenMustStillBeValid(next);
      if (user.resetTokenExpiresAt < moment().utc().toDate())
        throw new Error(`Oops!, your token has expired`);
      const hashedPassword = await this.encryptionService.hashPassword(
        req.body.password
      );

      const updateBody: Pick<
        User,
        "password" | "resetToken" | "resetTokenExpiresAt"
      > = {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      };

      await this.userService.updateUserById(user.id, updateBody);

      res.status(httpStatus.OK).json({
        status: "success",
        message: "Password reset was successful",
      });
    } catch (err: any) {
      return next(new AppException(err.message, err.status));
    }
  }

  async regenerateAccessToken(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = await this.authService.regenerateAccessToken<User>(
        req.body.refreshToken,
        User
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
  // async verifyOtp(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const hashedOtp = await this.encryptionService.hashString(req.body.otp);
  //     let _user: User = await this.userService.getUserDetail({
  //       otpToken: hashedOtp,
  //     });

  //     if (!_user)
  //       return next(
  //         new AppException("Oops!, invalid otp", httpStatus.BAD_REQUEST)
  //       );

  //     if (!_user) return TokenMustStillBeValid(next);
  //     if (_user.otpTokenExpiry < moment().utc().startOf("day").toDate())
  //       throw new Error(`Oops!, your token has expired`);

  //     _user = await this.userService.updateUserById(_user.id, {
  //       otpLogin: null,
  //       otpTokenExpiry: null,
  //     });

  //     const token = await this.authService.login(_user as any);
  //     return res.status(httpStatus.OK).json({
  //       status: "success",
  //       user: _user,
  //       token,
  //     });
  //   } catch (err: any) {
  //     return next(
  //       new AppException(err.status, err.message || httpStatus.FORBIDDEN)
  //     );
  //   }
  // }
}
