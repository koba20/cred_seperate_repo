/* eslint-disable @typescript-eslint/no-explicit-any */
import UserService from "../../services/User.service";
import httpStatus from "http-status";
import AppException from "../../exceptions/AppException";
import pick from "../../utils/pick";
import PaymentService from "../../services/payment.service";
import HelperClass from "../../utils/helper";
import { NextFunction, Response } from "express";
import { RequestType } from "../middlewares/auth.middleware";
import { getAllNotifications } from "../../utils/notification";
import { uploadBase64File } from "../../services/File.service";
import { UploadApiResponse } from "cloudinary";
import { EmailConfig, PaginationModel, Work } from "../../../index.d";
import mongoose from "mongoose";
import NotificationService from "../../services/Notification.service";
import User from "../../database/models/User.model";
import EncryptionService from "../../services/Encryption.service";
import OraganizationService from "../../services/Organization.service";
import moment from "moment";
import {
  ACCOUNT_STATUS,
  BVN_STATUS,
  NIN_STATUS,
  WORK_STATUS,
} from "../../../config/constants";
import Notifier from "../../services/sendchamp";
import WorkService from "../../services/Work.service";
import WS from "../../utils/ws.config";


const organizationService = new OraganizationService();

export default class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly paymentService: PaymentService,
    private readonly encryptionService: EncryptionService,
    private readonly workService: WorkService,
    private readonly organizationService: OraganizationService
  ) {}

  async getAllUsers(req: RequestType, res: Response, next: NextFunction) {
    try {
      const options = pick(req.query, ["limit", "page", "populate", "orderBy"]);
      const filter = pick(req.query, ["username", "portfolio"]);
      if (req.query.accountStatus) {
        Object.assign(filter, {
          accountStatus: { status: req.query.accountStatus },
        });
      }
      if (req.query.search) {
        Object.assign(filter, {
          $or: [
            { firstName: { $regex: req.query.search, $options: "i" } },
            { lastName: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        });
      }
      req.query.state
        ? Object.assign(filter, { "votingAddress.state": req.query.state })
        : delete req.query.state;
      req.query.lga
        ? Object.assign(filter, { "votingAddress.lga": req.query.lga })
        : delete req.query.lga;
      req.query.ward
        ? Object.assign(filter, { "votingAddress.ward": req.query.ward })
        : delete req.query.ward;
      req.query.pollingUnit
        ? Object.assign(filter, {
            "votingAddress.pollingUnit": req.query.pollingUnit,
          })
        : delete req.query.pollingUnit;
      req.query.senatorialDistrict
        ? Object.assign(filter, {
            senatorialDistrict: req.query.senatorialDistrict,
          })
        : delete req.query.senatorialDistrict;
      req.query.zone
        ? Object.assign(filter, {
            federalConstituency: req.query.zone,
          })
        : delete req.query.zone;

      const users = (await this.userService.getAllUsers(
        filter,
        options
      )) as PaginationModel<User>;
      let data: Record<string, any> = {};
      const records: Record<string, any> = [];
      await Promise.all(
        users.data.map(async (user) => {
          const userWalletInfo = await this.paymentService.getAccount({
            user: user.id,
          });

          const userInfo = { userWalletInfo };
          Object.assign(user, userInfo);
          // console.log(user);

          const userObj: Record<string, unknown> = { ...user };
          data = { user: userObj._doc, ...userInfo };
          delete data.user.password;
          delete data.user.__v;
          delete data.user.verificationToken;
          delete data.user.resetTokenExpiresAt;
          delete data.user.resetToken;
          records.push(data);
        })
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        data: {
          records,
          limit: users.limit,
          page: users.page,
          totalData: users.totalData,
          totalPages: users.totalPages,
        },
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async cancelRequest(req: RequestType, res: Response, next: NextFunction) {
    try {
      const _user = await this.userService.getUserById(req.user.id);
      if (!_user.requestToJoin)
        throw new Error("You don't have any pending request");

      const _work = await this.workService.getWorkByDetails({
        user: _user.id,
        organization: _user.requestToJoin,
      });

      await this.workService.findAndDelete(_work._id);
      await this.userService.updateUserById(req.user.id, {
        requestToJoin: null,
      });

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Request was cancelled successfully",
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async renewRequest(req: RequestType, res: Response, next: NextFunction) {
    try {
      const _user = await this.userService.getUserById(req.user.id);
      if (!_user.requestToJoin)
        throw new Error("You don't have any pending request ");

      const _work = await this.workService.getWorkByDetails({
        user: _user.id,
        organization: _user.requestToJoin,
      });

      if (!_work) throw new Error("We could not find your request");
      if (_work.status.status == WORK_STATUS.ACTIVE)
        throw new Error("Account is already approved. Thank you");

      const organization = await this.organizationService.getOrganizationById(
        _user.requestToJoin as string
      );

      const code = HelperClass.generateRandomChar(5, "num");
      const token = await this.encryptionService.hashString(code);

      await this.workService.updateWorkById(_work._id, {
        token: token,
        expiry: moment().add("1", "day").utc().toDate(),
      });

      const email: EmailConfig = HelperClass.prepareEmail({
        email: organization.hrInfo.email,
        name: organization.hrInfo.name,
        message: `Follow the link to Verify that ${_user.firstName} ${_user.lastName} https://hr.credx.ng/verify?token=${token}`,
        subject: "Staff Confirmation",
      });

      await new Notifier().email.sendGrid(email);
      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Your request was sent successfully",
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async getMyProfile(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = {};
      Object.assign(filter, {
        _id: new mongoose.Types.ObjectId(req.user.id),
      });
      const me = await this.userService.queryAllUserDetails(filter);
      return res.status(httpStatus.OK).json({
        status: "success",
        me,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async updateMyProfile(req: RequestType, res: Response, next: NextFunction) {
    try {
      const me = await this.userService.updateUserById(req.user.id, req.body);
      return res.status(httpStatus.OK).json({
        status: "success",
        me,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async uploadAvatar(req: RequestType, res: Response, next: NextFunction) {
    try {
      const file = req.file as Express.Multer.File;
      const public_id = `-${HelperClass.generateRandomChar(32)}`;
      const photos = (await uploadBase64File(
        file.path,
        "user_avatar",
        public_id
      )) as UploadApiResponse;
      const me = await this.userService.updateUserById(req.user.id, {
        avatar: { url: photos.secure_url, public_id },
      });
      return res.status(httpStatus.OK).json({
        status: "success",
        me,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async joinOrganization(req: RequestType, res: Response, next: NextFunction) {
    try {
      const _user = await this.userService.getUserById(req.user.id);
  
      const _organization = await organizationService.getOrganizationById(
        req.body.organization
      );
   
      if(_user.work) throw new Error("You already paired with a business")
      if (!_organization) throw new Error("Organization not found");
      const _workExist = await this.workService.getWorkByDetails({
        user: _user,
        organization: req.body.organization,
        status: {
          status: WORK_STATUS.PENDING,
        },
      });

      if (_workExist)
        throw new Error("You have a pending request with this organization");

      const OTP_CODE = HelperClass.generateRandomChar(5, "num");
      const token = await this.encryptionService.hashString(OTP_CODE);
      const exp = moment().add("1", "day").utc().toDate();

      const email: EmailConfig = HelperClass.prepareEmail({
        email: _organization.hrInfo.email,
        name: _organization.hrInfo.name,
        message: `Follow the link to Verify that ${_user.firstName} ${_user.lastName} is a part of ${_organization.name}  https://hr.credx.ng/verify?token=${token}`,
        subject: "Staff Confirmation",
      });

      const work: Partial<Work> = {
        organization: _organization.id,
        role: req.body.role,
        salary: req.body.salary,
        user: req.user._id,
        email: req.body.email,
        token: token,
        expiry: exp,
        balance: {
          line: 0, // How much you can take == Salary
          trench: 0, // How much you want
          exposure: 0,
        },
        account:{
          bankCode: req.body.account.bankCode,
          accountNumber: req.body.account.accountNumber,
          accountName: req.body.account.accountName,
          bankName: req.body.account.bankName,
        },
        status: {
          status: WORK_STATUS.PENDING,
          reason: "",
        },
      };


      await new Notifier().email.sendGrid(email);
      await this.workService.createWork(work);
      const updatedUser = await this.userService.updateUserById(_user.id, {
        requestToJoin: _organization.id,
      });

      return res.status(httpStatus.OK).json({
        status: "success",
        message:
          "You request has been posted. And is waiting for approval. Thank you",
        user: updatedUser,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async submitToken(req: RequestType, res: Response, next: NextFunction) {
    try {
      await this.userService.updateUserById(req.user.id, {
        pushNotificationId: req.body.token,
      });
      return res.status(httpStatus.OK).json({
        status: "success",
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getUserProfile(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = {};
      req.params.userId
        ? Object.assign(filter, {
            _id: new mongoose.Types.ObjectId(req.params?.userId as string),
          })
        : Object.assign(filter, {
            username: req.params?.username as string,
          });
      const user = await this.userService.queryAllUserDetails(filter);
      return res.status(httpStatus.OK).json({
        status: "success",
        user,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async searchUsers(req: RequestType, res: Response, next: NextFunction) {
    try {
      const user = await this.userService.searchUsers(req.query.q as string);
      return res.status(httpStatus.OK).json({
        status: "success",
        user,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async sendMessage(req: RequestType, res: Response, next: NextFunction) {
    try {
      WS.instance.emitEventToClient(req.user.id, "iWork", {
        something: "that works",
      });

      //
      return res.status(httpStatus.OK).json({
        status: "success",
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async saveUserDeviceInfo(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await this.userService.saveUserDeviceInfo(
        req.body,
        req.user
      );
      return res.status(httpStatus.OK).json({
        status: "success",
        data,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async getNotifications(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = pick(req.query, ["user", "read", "type", "exclude"]);
      if ("type" in filter && filter.type === "all") delete filter.type;
      if ("exclude" in filter) {
        let props = filter.exclude as string;
        const exclude = props.split(",");
        Object.assign(filter, { type: { $nin: exclude } });
      }

      const options = pick(req.query, ["limit", "page", "populate", "orderBy"]);
      const data = await getAllNotifications(filter, options);
      return res.status(httpStatus.OK).json({
        status: "success",
        data,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async markNotificationAsRead(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      await Promise.all(
        req.body.notifications.map(async (notification: string) => {
          await NotificationService.updateNotification(notification, {
            read: true,
          });
        })
      );
      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Notification marked as read",
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async addKYC(req: RequestType, res: Response, next: NextFunction) {
    try {
      let message;
      let user;
      let ninStatus = false;
      let bvnStatus = false;

      const nin = req.body.nin;
      const bvn = req.body.bvn;

      const hashedNIN = this.encryptionService.encodeString(nin, req.user.id);
      const hashedBvn = this.encryptionService.encodeString(bvn, req.user.id);

      delete req.body.nin;
      delete req.body.bvn;

      // if (req.user.accountStatus.status === ACCOUNT_STATUS.ACTIVATED)
      //   throw new Error("Account already activated");

      if (req.user.kyc.nin.status === NIN_STATUS.VERIFIED) ninStatus = true;
      if (req.user.kyc.bvn.status === BVN_STATUS.VERIFIED) bvnStatus = true;

      /// lets do NIN first
      if (!ninStatus) {
        const checkIfNINInUse = await this.userService.getUserDetail({
          "kyc.nin.nin": hashedNIN,
        });

        if (!checkIfNINInUse) {
          const verifyNIN = await this.userService.validateNin(nin);
          if (verifyNIN) {
            req.body.firstName = HelperClass.titleCase(verifyNIN.first_name);
            req.body.lastName = HelperClass.titleCase(verifyNIN.last_name);
            await this.userService.updateUserById(req.user.id, {
              ...req.body,
              kyc: {
                tier: "tier2",
                bvn: { ...req.user.kyc.bvn },
                nin: {
                  nin: hashedNIN,
                  status: NIN_STATUS.VERIFIED,
                },
              },
            });
            ninStatus = true;
          }
        }
      }
      if (!bvnStatus) {
        const verifyBNV = await this.userService.validateBvn(bvn);
        if (verifyBNV) {
          const checkIfBvnIsInUse = await this.userService.getUserDetail({
            "kyc.bvn.bvn": hashedBvn,
          });
          if (!checkIfBvnIsInUse) {
            await this.userService.updateUserById(req.user.id, {
              ...req.body,
              tier: "tier3",
              kyc: {
                nin: { ...req.user.kyc.nin },
                bvn: { bvn: hashedBvn, status: BVN_STATUS.VERIFIED },
              },
            });
            bvnStatus = true;
          }
        }
      }

      if (ninStatus && bvnStatus) {
        user = await this.userService.getUserById(req.user.id);
        let accountInfo = await this.paymentService.queryAccountInfoByUser(
          req.user.id
        );
        if (!accountInfo) {
          await this.paymentService.setupAccount<User>(user, {});
          user = await this.userService.updateUserById(req.user.id, {
            accountStatus: {
              status: ACCOUNT_STATUS.ACTIVATED,
              reason: "Profile validated and updated",
            },
          });
        }

        return res.status(httpStatus.OK).json({
          status: "success",
          message: "NIN and BVN Validated successfully",
          user: user,
        });
      } else if (ninStatus && !bvnStatus) {
        message = "NIN Validation successfully, BVN Validation Failed";
        throw new Error(message);
      } else if (!ninStatus && bvnStatus) {
        message = "BVN Validation Success, NIN Verification failed";
        throw new Error(message);
      } else {
        message = "NIN and BVN Validation Failed";
        throw new Error(message);
      }
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async addBvn(req: RequestType, res: Response, next: NextFunction) {
    try {
      const bvn = req.body.bvn;
      const hashedBvn = await this.encryptionService.hashString(bvn);
      delete req.body.bvn;

      if (req.user.kyc.bvn.status === BVN_STATUS.VERIFIED) {
        throw new Error("BVN alrady activeted");
      }

      if (req.user.kyc.nin.status !== NIN_STATUS.VERIFIED) {
        throw new Error("Please verify your NIN first");
      }

      const checkIfBvnIsInUSe = await this.userService.getUserDetail({
        "kyc.bvn.bvn": hashedBvn,
      });

      if (checkIfBvnIsInUSe) {
        throw new Error("BVN is not available");
      }

      const verifyBVN = await this.userService.validateBvn(bvn);
      if (!verifyBVN) throw new Error("Error validating your BVNs");

      const user = await this.userService.updateUserById(req.user.id, {
        ...req.body,
        kyc: {
          nin: { ...req.user.kyc.nin },
          bvn: { bvn: hashedBvn, status: BVN_STATUS.VERIFIED },
        },
      });

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "BVN information updated",
        user,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async getUserReferredUsers(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const options = pick(req.query, ["limit", "page", "populate", "orderBy"]);
      const filter = pick(req.query, ["user"]);
      const user = await this.userService.getUserDetail(filter);
      const data = await this.userService.getAllUsers(
        {
          inviteCode: user.referralCode,
        },
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

  async changePassword(req: RequestType, res: Response, next: NextFunction) {
    try {
      const user = await User.findOne({ _id: req.user.id }).select("+password");
      if (
        !(await this.encryptionService.comparePassword(
          user.password,
          req.body.oldPassword
        ))
      )
        throw new Error("Incorrect password");
      const newPassword = await this.encryptionService.hashPassword(
        req.body.password
      );
      const me = await this.userService.updateUserById(req.user.id, {
        password: newPassword,
      });
      return res.status(httpStatus.OK).json({
        status: "success",
        me,
      });
    } catch (err: unknown) {
      if (err instanceof Error)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }
}
