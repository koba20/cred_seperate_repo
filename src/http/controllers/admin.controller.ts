/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Response } from "express";
import AdminService from "../../services/Admin.service";
import { RequestType } from "../middlewares/auth.middleware";
import httpStatus from "http-status";
import AppException from "../../exceptions/AppException";
import AuthService from "../../services/Auth.service";
import HelperClass from "../../utils/helper";
import UserService from "../../services/User.service";
import config from "../../../config/config";
import {
  ACCOUNT_STATUS,
  ADMIN_FUNDING_TYPE,
  ADMIN_ROLE,
  CURRENCIES,
  TRANSACTION_CATEGORIES,
  TRANSACTION_SOURCES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
  WALLET_MODE,
} from "../../../config/constants";
import User from "../../database/models/User.model";
import EmailService from "../../services/Email.service";
import pick from "../../utils/pick";
import EncryptionService from "../../services/Encryption.service";
import PaymentService from "../../services/payment.service";
import generateTxRef from "../../utils/generateTxRef";
import moment from "moment";
import { deleteFile, uploadBase64File } from "../../services/File.service";
import { UploadApiResponse } from "cloudinary";
import { TransactionLogInterface } from "../../..";
import RESERVED_NAMES from "../../utils/reservedNames";

export default class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly paymentService: PaymentService,
    private readonly encryptionService: EncryptionService,

  ) {}
  async createAdmin(req: RequestType, res: Response, next: NextFunction) {
    try {
      const emailTaken = await this.userService.getUserDetail({
        email: req.body.email,
      });
      delete req.body.confirmPassword;
      const phoneNumberTaken = await this.userService.getUserDetail({
        phoneNumber: req.body.phoneNumber,
      });
      if (emailTaken) throw new Error(`Oops!, ${emailTaken.email} is taken`);
      if (phoneNumberTaken)
        throw new Error(`Oops!, ${phoneNumberTaken.phoneNumber} is taken`);
      if (
        req.body.portfolio === ADMIN_ROLE.SUPER_ADMIN &&
        req.admin.portfolio !== ADMIN_ROLE.ENGINEER
      )
        throw new Error("Oops!, you are not allowed to create a super admin");
      const password = req.body.password;
      req.body.password = await this.encryptionService.hashPassword(
        req.body.password
      );
      req.body.firstName = HelperClass.titleCase(req.body.firstName);
      req.body.lastName = HelperClass.titleCase(req.body.lastName);
      req.body.referralCode = HelperClass.generateRandomChar(6, "upper-num");
      req.body.phoneNumber = req.body.phoneNumber.startsWith("+234")
        ? req.body.phoneNumber
        : `+234${req.body.phoneNumber.replace(/^0+/, "")}`;
      req.body.createdBy = req.admin.id;
      req.body.status = {
        status: ACCOUNT_STATUS.ACTIVATED,
        reason: "Account activated",
      };
      const data = await this.adminService.createAdmin(req.body);
      await this.emailService.sendAdminLoginCredentials(
        data.email,
        `${data.firstName} ${data.lastName}`,
        `Admin created successfully, login credentials has been sent to ${data.email} and ${data.phoneNumber}`,
        password
      );
      res.status(httpStatus.CREATED).json({
        status: "success",
        admin: data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getAdmins(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = pick(req.query, ["accountStatus", "role"]);
      const options = pick(req.query, ["orderBy", "page", "limit", "populate"]);
      if (req.query.search) {
        const search = {
          $or: [
            { firstName: { $regex: req.query.search, $options: "i" } },
            { lastName: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        };
        Object.assign(filter, search);
      }
      const data = await this.adminService.getAllAdmins(filter, options);
      res.status(httpStatus.OK).json({
        status: "success",
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getAdmin(req: RequestType, res: Response, next: NextFunction) {
    try {
      const data = await this.adminService.getAdminById(req.params.adminId);
      if (!data) throw new Error("Admin not found");
      res.status(httpStatus.OK).json({
        status: "success",
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async updateAdmin(req: RequestType, res: Response, next: NextFunction) {
    try {
      req.body.updatedBy = req.admin.id;
      if (req.body.password) {
        if (
          !(await this.encryptionService.comparePassword(
            req.admin.password,
            req.body.oldPassword
          ))
        )
          throw new Error(`Oops!, old password is incorrect`);

        req.body.password = await this.encryptionService.hashPassword(
          req.body.password
        );
      }
      if (req.body.avatar) {
        if (req.admin.avatar.publicId) {
          await deleteFile(req.admin?.avatar?.publicId);
        }
        const publicId = HelperClass.generateRandomChar(12);
        const photo = await uploadBase64File(
          req.body.avatar,
          "admin_avatar",
          publicId
        );

        req.body.avatar = { url: photo.secure_url, publicId };
      }
      req.body.updatedBy = req.admin.id;
      req.body.updatedAt = moment().utc().toDate();
      const data = await this.adminService.updateAdminById(
        req.params.adminId,
        req.body
      );
      if (!data) throw new Error("Admin not found");
      res.status(httpStatus.OK).json({
        status: "success",
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async deleteAdmin(req: RequestType, res: Response, next: NextFunction) {
    try {
     await this.adminService.deleteAdminById(req.params.adminId);
      res.status(httpStatus.OK).json({
        status: 'success',
        message: 'Admin deleted successfully',
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async createUser(req: RequestType, res: Response, next: NextFunction) {
    try {
      req.body.phoneNumber = req.body.phoneNumber.startsWith("+234")
        ? req.body.phoneNumber
        : `+234${req.body.phoneNumber.replace(/^0+/, "")}`;

      const emailTaken = await this.userService.getUserDetail({
        email: req.body.email,
      });
      delete req.body.confirmPassword;
      const phoneNumberTaken = await this.userService.getUserDetail({
        phoneNumber: req.body.phoneNumber,
      });
      if (emailTaken) throw new Error(`Oops!, ${emailTaken.email} is taken`);
      if (phoneNumberTaken)
        throw new Error(`Oops!, ${phoneNumberTaken.phoneNumber} is taken`);
      req.body.firstName = HelperClass.titleCase(req.body.firstName);
      req.body.lastName = HelperClass.titleCase(req.body.lastName);
      req.body.referralCode = HelperClass.generateRandomChar(6, "upper-num");
      req.body.accountStatus = {
        status: ACCOUNT_STATUS.ACTIVATED,
        reason: "Account activated",
      };
      if (RESERVED_NAMES.includes(req.body.username))
        throw new Error("Username unavailable, please choose another username");
      const password = req.body.password;
      req.body.password = await this.encryptionService.hashPassword(
        req.body.password
      );
      const user = await this.authService.create<User>(req.body, User);
      await this.emailService.sendAdminLoginCredentials(
        user.email,
        `${user.firstName} ${user.lastName}`,
        `An account has been created for you on ${config.appName}. Use this email ${user.email} and the password below to login to your account.`,
        password
      );
      res.status(httpStatus.CREATED).json({
        status: "success",
        message: "User created successfully",
        user,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async updateUserRecord(req: RequestType, res: Response, next: NextFunction) {
    try {
      if (req.body.phoneNumber) {
        req.body.phoneNumber = req.body.phoneNumber.startsWith("+234")
          ? req.body.phoneNumber
          : `+234${req.body.phoneNumber.replace(/^0+/, "")}`;
      }
      req.body.updatedBy = req.admin.id;
      req.body.updatedAt = moment().utc().toDate();
      const data = await this.userService.updateUserById(
        req.query.userId as string,
        req.body
      );
      res.status(httpStatus.OK).json({
        status: "success",
        message: "User record updated successfully",
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async lockUserWallet(req: RequestType, res: Response, next: NextFunction) {
    try {
      const userWallet = await this.paymentService.queryAccountInfo({
        user: req.params.userId,
      });
      const isLocked = req.body.locked === true ? true : false;
      userWallet.lock = {
        isLocked,
        updatedAt: moment().utc().toDate(),
        lockedBy: req.admin.id,
        reason: req.body.reason,
      };
      await userWallet.save();

      res.status(httpStatus.OK).json({
        status: "success",
        message: `User wallet ${
          userWallet.locked === false ? "unlocked" : "locked"
        } successfully`,
        userWallet,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.NOT_FOUND));
      }
    }
  }

  async fundUserWallet(req: RequestType, res: Response, next: NextFunction) {
    try {
      if (req.body.fundingType === ADMIN_FUNDING_TYPE.SINGLE_USER) {
        await this.fundSingleUser(req, res, next);
      }
      if (req.body.fundingType === ADMIN_FUNDING_TYPE.GROUP) {
        await this.groupFunding(req, res, next);
      }

      if (req.body.fundingType === ADMIN_FUNDING_TYPE.BULK) {
        await this.bulkFunding(req, res, next);
      }
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.NOT_FOUND));
      }
    }
  }

  private async fundSingleUser(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const proceed = await this.paymentService.controlTransaction(req.body);
      if (!proceed)
        return next(
          new AppException(
            "Duplicate transaction, withdrawal already initialized",
            httpStatus.BAD_REQUEST
          )
        );
      const user = await this.userService.getUserDetail({
        username: req.body.username,
      });
      const adminWalletInfo = await this.paymentService.queryAccountInfo({
        walletType: "super_admin",
      });
      if (!adminWalletInfo) throw new Error("Admin wallet not found");

      const initiateOperation = async () => {
        const updatedBalance = Number(
          (adminWalletInfo.availableBalance - Number(req.body.amount)).toFixed(
            2
          )
        );
        const transferResponse = await this.paymentService.transferMoney(
          req.body,
          req.admin,
          req.body.account,
          `${config.appName}`
        );
        await this.paymentService.updateAvailableBalance(updatedBalance, {
          user: adminWalletInfo.user,
        });

        const transaction = await this.paymentService.createTransactionLog({
          admin: adminWalletInfo.admin,
          initiator: "ADMIN",
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          type: TRANSACTION_TYPES.DEBIT,
          amount: Number(req.body.amount),
          purpose: req.body.purpose || null,
          reference: transferResponse.reference,
          category: req.body.transactionCategory,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          meta: {
            username: req.body.username,
            accountName: transferResponse.destinationAccountHolderNameAtBank,
            currency: transferResponse.currency,
            fee: transferResponse.fee,
            message: transferResponse.message,
            reference: transferResponse.reference,
            transactionType: "Transfer",
          },
        });

        const message = `${req.body.amount} NGN was debited from your account to (${transferResponse.destinationAccountHolderNameAtBank}/${transferResponse.username})`;
        const admin = await this.adminService.getAdminById(
          adminWalletInfo.admin as string
        );

        this.emailService.debitUserAccountEmail(
          admin.email,
          `${user.firstName} ${user.lastName}`,
          message
        );

        res.status(httpStatus.OK).json({
          status: "success",
          message:
            Math.sign(updatedBalance) === 1
              ? `User wallet funded successfully`
              : `User wallet funded successfully, but the admin wallet is now on a deficit of ${updatedBalance} NGN`,
          transaction,
        });
      };

      if (
        adminWalletInfo.walletMode === WALLET_MODE.STRICT &&
        req.body.amount > adminWalletInfo.availableBalance
      )
        throw new Error(
          "Oops!, insufficient balance to perform this operation"
        );
      if (
        adminWalletInfo.walletMode === WALLET_MODE.STRICT &&
        req.body.amount <= adminWalletInfo.availableBalance
      )
        await initiateOperation();
      if (
        adminWalletInfo.walletMode === WALLET_MODE.LOOSE &&
        (req.body.amount <= adminWalletInfo.availableBalance ||
          req.body.amount >= adminWalletInfo.availableBalance)
      )
        await initiateOperation();
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  private async groupFunding(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const users = await User.aggregate([
        ...(req.body.groupFunding.portfolio
          ? [
              {
                $match: { PORTFOLIO: req.body.groupFunding.portfolio },
              },
            ]
          : []),
        ...(req.body.groupFunding.state
          ? [
              {
                $match: { "votingAddress.state": req.body.groupFunding.state },
              },
            ]
          : []),
        ...(req.body.groupFunding.lga
          ? [
              {
                $match: { "votingAddress.lga": req.body.groupFunding.lga },
              },
            ]
          : []),
        ...(req.body.groupFunding.pollingUnit
          ? [
              {
                $match: {
                  "votingAddress.pollingUnit":
                    req.body.groupFunding.pollingUnit,
                },
              },
            ]
          : []),
        ...(req.body.groupFunding.ward
          ? [
              {
                $match: {
                  "address.ward": req.body.groupFunding.ward,
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: "accounts",
            localField: "_id",
            foreignField: "user",
            as: "account",
          },
        },
        {
          $unwind: {
            path: "$account",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            __v: 0,
            __t: 0,
            t: 0,
            password: 0,
            verificationToken: 0,
          },
        },
      ]);

      if (users.length <= 0)
        throw new Error("Oops! no user found that matches this condition");

      const adminWalletInfo = await this.paymentService.queryAccountInfo({
        walletType: "super_admin",
      });

      if (!adminWalletInfo) {
        return next(
          new AppException(
            "Oops!, we could not find the admin wallet",
            httpStatus.BAD_REQUEST
          )
        );
      }

      if (req.body.transactionCategory === TRANSACTION_CATEGORIES.SALARY) {
        const usersThatGotPaid: { [key: string]: string }[] = [];
        const unpaidUsers: { [key: string]: any }[] = [];
        const totalSalaryToBePaid = users.reduce(
          (acc, user) => acc + user.meta.amountToBePaid,
          0
        );
        const totalEarnAllowanceToBePaid = users.reduce(
          (acc, user) => acc + user.meta.earnAllowance,
          0
        );
        let amountToBePaid =
          Number(totalSalaryToBePaid) + Number(totalEarnAllowanceToBePaid);
        const initiatePayment = async () => {
          for (const user of users) {
            const userAccountInfo = await this.paymentService.queryAccountInfo({
              user: user._id,
            });
            if (!userAccountInfo) {
              unpaidUsers.push({
                name: `${user.lastName} ${user.firstName}`,
              });
              continue;
            }

            const updatedUserAccountBalance =
              req.body.account === "AVAILABLE_BALANCE"
                ? Number(
                    (
                      userAccountInfo.availableBalance +
                      user.meta.amountToBePaid
                    ).toFixed(2)
                  )
                : Number(
                    (
                      userAccountInfo.ledgerBalance + user.meta.amountToBePaid
                    ).toFixed(2)
                  );
            await this.paymentService.updateAvailableBalance(
              updatedUserAccountBalance,
              {
                user: user._id,
              }
            );
            await this.paymentService.updateLedgerBalance(
              Number(
                (
                  userAccountInfo.ledgerBalance +
                  Number(user.meta.earnAllowance)
                ).toFixed(2)
              ),
              {
                user: user._id,
              }
            );
            const txRef = generateTxRef(32, "num");
            await this.paymentService.createTransactionLog({
              user: user._id,
              source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
              type: TRANSACTION_TYPES.CREDIT,
              initiator: "ADMIN",
              receiver: "USER",
              amount: user.meta.amountToBePaid,
              purpose: req.body.purpose,
              reference: txRef,
              status: TRANSACTION_STATUS.SUCCESSFUL,
              category: TRANSACTION_CATEGORIES.SALARY,
              balanceAfterTransaction: updatedUserAccountBalance,
              meta: {
                currency: CURRENCIES.NGN,
                reference: txRef,
                initiator: {
                  name: `${req.admin.lastName} ${req.admin.firstName}`,
                  email: req.admin.email,
                },
              },
            });
            usersThatGotPaid.push(user);
            const message = `${user.meta.amountToBePaid} NGN was credited to your wallet by Admin. Reason: ${req.body.purpose}`;
            this.emailService.sendUserAccountCreditedEmail(
              user.email,
              `${HelperClass.titleCase(user.lastName)} ${HelperClass.titleCase(
                user.firstName
              )}`,
              message
            );
          }
          const amountThatWasNotPaid = unpaidUsers.reduce(
            (acc, user) => acc + user.meta.amountToBePaid,
            0
          );
          amountToBePaid -= Number(amountThatWasNotPaid);
          const updatedAccountBalance = Number(
            (adminWalletInfo.availableBalance - amountToBePaid).toFixed(2)
          );

          await this.paymentService.updateAvailableBalance(
            updatedAccountBalance,
            {
              walletType: "super_admin",
            }
          );

          const txRef = generateTxRef(32, "num");
          const txDetails = await this.paymentService.createTransactionLog({
            admin: adminWalletInfo.admin,
            source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
            type: TRANSACTION_TYPES.DEBIT,
            initiator: "ADMIN",
            amount: amountToBePaid,
            purpose: req.body.purpose,
            reference: txRef,
            status: TRANSACTION_STATUS.SUCCESSFUL,
            category: req.body.transactionCategory,
            balanceAfterTransaction: updatedAccountBalance,
            meta: {
              currency: CURRENCIES.NGN,
              totalBeneficiaries: usersThatGotPaid.length,
              beneficiaries: usersThatGotPaid,
            },
          });
          if (unpaidUsers.length > 0) {
            this.emailService.paymentUnsuccessfulEmail(
              req.admin.email,
              `${req.admin.firstName} ${req.admin.lastName}`,
              unpaidUsers
            );
          }
          return res.status(httpStatus.OK).json({
            status: "success",
            message:
              Math.sign(adminWalletInfo.availableBalance - amountToBePaid) === 1
                ? `Staff salary paid successfully.`
                : `Staff salary paid successfully. However, the admin wallet is at a deficit of ${Number(
                    adminWalletInfo.availableBalance - amountToBePaid
                  ).toFixed(2)} NGN`,
            txDetails,
          });
        };

        if (
          adminWalletInfo.walletMode === WALLET_MODE.STRICT &&
          amountToBePaid > adminWalletInfo.availableBalance
        )
          throw new Error(
            "Oops!, insufficient balance to perform this operation"
          );
        if (
          adminWalletInfo.walletMode === WALLET_MODE.STRICT &&
          amountToBePaid <= adminWalletInfo.availableBalance
        )
          await initiatePayment();

        if (
          adminWalletInfo.walletMode === WALLET_MODE.LOOSE &&
          (amountToBePaid <= adminWalletInfo.availableBalance ||
            amountToBePaid >= adminWalletInfo.availableBalance)
        )
          await initiatePayment();
      }

      let amountDebited = Number(
        Number(req.body.groupFunding.amount * users.length).toFixed(2)
      );

      const initiateOperation = async () => {
        const usersThatGotPaid = [];
        const unpaidUsers: { [key: string]: string }[] = [];
        /** credit the users selected */
        for (const user of users) {
          const userAccountInfo = await this.paymentService.queryAccountInfo({
            user: user._id,
          });
          if (!userAccountInfo) {
            unpaidUsers.push({
              name: `${user.lastName} ${user.firstName}`,
            });
            continue;
          }

          const updatedUserAccountBalance =
            req.body.account === "AVAILABLE_BALANCE"
              ? Number(
                  (
                    userAccountInfo.availableBalance +
                    req.body.groupFunding.amount
                  ).toFixed(2)
                )
              : Number(
                  (
                    userAccountInfo.ledgerBalance + req.body.groupFunding.amount
                  ).toFixed(2)
                );
          await this.paymentService.updateAvailableBalance(
            updatedUserAccountBalance,
            {
              user: user._id,
            }
          );
          const txRef = generateTxRef(32, "num");
          await this.paymentService.createTransactionLog({
            user: user._id,
            initiator: "ADMIN",
            receiver: "USER",
            source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
            type: TRANSACTION_TYPES.CREDIT,
            amount: req.body.groupFunding.amount,
            purpose: req.body.purpose,
            reference: txRef,
            status: TRANSACTION_STATUS.SUCCESSFUL,
            category: req.body.transactionCategory,
            balanceAfterTransaction: updatedUserAccountBalance,
            meta: {
              currency: CURRENCIES.NGN,
              initiator: {
                name: `${req.admin.lastName} ${req.admin.firstName}`,
                email: req.admin.email,
              },
              reference: txRef,
            },
          });
          usersThatGotPaid.push(user);
          const message = `${req.body.groupFunding.amount} NGN was credited to your wallet by Admin. Reason: ${req.body.purpose}`;
          this.emailService.sendUserAccountCreditedEmail(
            user.email,
            `${HelperClass.titleCase(user.lastName)} ${HelperClass.titleCase(
              user.firstName
            )}`,
            message
          );
        }
        amountDebited = Number(
          (req.body.groupFunding.amount * usersThatGotPaid.length).toFixed(2)
        );
        const updatedAccountBalance = Number(
          Number(adminWalletInfo.availableBalance - amountDebited).toFixed(2)
        );

        /** Debit the Admin wallet */
        await this.paymentService.updateAvailableBalance(
          updatedAccountBalance,
          {
            walletType: "super_admin",
          }
        );

        const txRef = generateTxRef(32, "num");
        const txDetails = await this.paymentService.createTransactionLog({
          admin: adminWalletInfo.admin,
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          initiator: "ADMIN",
          type: TRANSACTION_TYPES.DEBIT,
          amount: amountDebited,
          purpose: req.body.purpose,
          reference: txRef,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          category: req.body.transactionCategory,
          balanceAfterTransaction: updatedAccountBalance,
          meta: {
            currency: CURRENCIES.NGN,
            totalBeneficiaries: usersThatGotPaid.length,
            beneficiaries: usersThatGotPaid,
          },
        });
        if (unpaidUsers.length > 0) {
          this.emailService.paymentUnsuccessfulEmail(
            req.admin.email,
            `${req.admin.firstName} ${req.admin.lastName}`,
            unpaidUsers
          );
        }
        return res.status(httpStatus.OK).json({
          status: "success",
          message:
            Math.sign(updatedAccountBalance) === 1
              ? `Payment was successful.`
              : `Payment was successful. However, the admin wallet is at a deficit of ${Number(
                  updatedAccountBalance
                ).toFixed(2)} NGN`,
          txDetails,
        });
      };

      if (
        adminWalletInfo.walletMode === WALLET_MODE.STRICT &&
        amountDebited > adminWalletInfo.availableBalance
      )
        return next(
          new AppException(
            `Oops! you don't have enough funds to complete this transaction`,
            httpStatus.BAD_REQUEST
          )
        );

      if (
        adminWalletInfo.walletMode === WALLET_MODE.STRICT &&
        amountDebited <= adminWalletInfo.availableBalance
      )
        await initiateOperation();

      if (
        adminWalletInfo.walletMode === WALLET_MODE.LOOSE &&
        (amountDebited <= adminWalletInfo.availableBalance ||
          amountDebited >= adminWalletInfo.availableBalance)
      )
        await initiateOperation();
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  private async bulkFunding(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const proceed = await this.paymentService.controlTransaction(req.body);
      if (!proceed)
        return next(
          new AppException(
            "Duplicate transaction, withdrawal already initialized",
            httpStatus.BAD_REQUEST
          )
        );
      const adminWalletInfo = await this.paymentService.queryAccountInfo({
        walletType: "super_admin",
      });
      let totalAmountToBePaid = req.body.bulkFunding.reduce(
        (acc: number, item: { username: string; amount: number }) =>
          acc + item.amount,
        0
      );
      const initiatePayment = async () => {
        const unpaidUsers: { [key: string]: any }[] = [];
        const usersThatGotPaid: User[] = [];
        await Promise.all(
          req.body.bulkFunding.map(
            async (item: { username: string; amount: number }) => {
              const userAccountInfo =
                await this.paymentService.queryAccountInfo({
                  username: item.username,
                });
              const user = await this.userService.getUserDetail({
                username: item.username,
              });
              if (!userAccountInfo) {
                unpaidUsers.push({
                  name: `${user.lastName} ${user.firstName}`,
                  amount: item.amount,
                });
                return;
              }
              const updatedUserAccountBalance =
                req.body.account === "AVAILABLE_BALANCE"
                  ? Number(
                      (userAccountInfo.availableBalance + item.amount).toFixed(
                        2
                      )
                    )
                  : Number(
                      (userAccountInfo.ledgerBalance + item.amount).toFixed(2)
                    );
              await this.paymentService.updateAvailableBalance(
                updatedUserAccountBalance,
                {
                  user: user._id as string,
                }
              );

              const txRef = generateTxRef(32, "num");
              await this.paymentService.createTransactionLog({
                user: user.id,
                source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
                type: TRANSACTION_TYPES.CREDIT,
                initiator: "ADMIN",
                receiver: "USER",
                balanceAfterTransaction: updatedUserAccountBalance,
                amount: item.amount,
                purpose: req.body.purpose,
                reference: txRef,
                status: TRANSACTION_STATUS.SUCCESSFUL,
                category: req.body.transactionCategory,
                meta: {
                  currency: CURRENCIES.NGN,
                  initiator: {
                    name: `${req.admin.lastName} ${req.admin.firstName}`,
                    email: req.admin.email,
                  },
                  reference: txRef,
                },
              });
              usersThatGotPaid.push(user);

              const message = `${item.amount} NGN was credited to your wallet by Admin. Reason: ${req.body.purpose}`;
              this.emailService.sendUserAccountCreditedEmail(
                user.email,
                `${HelperClass.titleCase(
                  user.lastName
                )} ${HelperClass.titleCase(user.firstName)}`,
                message
              );
            }
          )
        );
        const unpaidAmount = unpaidUsers.reduce(
          (acc: number, item: { [key: string]: number }) => acc + item.amount,
          0
        );
        totalAmountToBePaid -= unpaidAmount;
        const amountDebited = Number(totalAmountToBePaid.toFixed(2));
        const updatedAccountBalance = Number(
          Number(adminWalletInfo.availableBalance - amountDebited).toFixed(2)
        );
        await this.paymentService.updateAvailableBalance(
          updatedAccountBalance,
          {
            admin: adminWalletInfo.admin,
          }
        );
        const txRef = generateTxRef(32, "num");
        const txDetails = await this.paymentService.createTransactionLog({
          admin: adminWalletInfo.admin,
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          type: TRANSACTION_TYPES.DEBIT,
          initiator: "ADMIN",
          amount: totalAmountToBePaid,
          purpose: req.body.purpose,
          reference: txRef,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          category: req.body.transactionCategory,
          balanceAfterTransaction: updatedAccountBalance,
          meta: {
            currency: CURRENCIES.NGN,
            totalBeneficiaries: usersThatGotPaid.length,
            beneficiaries: usersThatGotPaid,
          },
        });
        if (unpaidUsers.length > 0) {
          this.emailService.paymentUnsuccessfulEmail(
            req.admin.email,
            `${req.admin.firstName} ${req.admin.lastName}`,
            unpaidUsers
          );
        }
        return res.status(httpStatus.OK).json({
          status: "success",
          message:
            Math.sign(
              adminWalletInfo.availableBalance - totalAmountToBePaid
            ) === 1
              ? `Users have been funded successfully.`
              : `Users have been funded successfully. However, the admin wallet is at a deficit of ${Number(
                  adminWalletInfo.availableBalance - totalAmountToBePaid
                ).toFixed(2)} NGN`,
          txDetails,
        });
      };
      if (
        adminWalletInfo.walletMode === WALLET_MODE.STRICT &&
        totalAmountToBePaid > adminWalletInfo.availableBalance
      )
        throw new Error(
          "Oops!, insufficient balance to perform this operation"
        );
      if (
        adminWalletInfo.walletMode === WALLET_MODE.STRICT &&
        totalAmountToBePaid <= adminWalletInfo.availableBalance
      )
        await initiatePayment();
      if (
        adminWalletInfo.walletMode === WALLET_MODE.LOOSE &&
        (totalAmountToBePaid <= adminWalletInfo.availableBalance ||
          totalAmountToBePaid >= adminWalletInfo.availableBalance)
      )
        await initiatePayment();
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async uploadAvatar(req: RequestType, res: Response, next: NextFunction) {
    try {
      const file = req.file as Express.Multer.File;
      const publicId = `-${HelperClass.generateRandomChar(32)}`;
      const photos = (await uploadBase64File(
        file.path,
        "admin_avatar",
        publicId
      )) as UploadApiResponse;
      const me = await this.adminService.updateAdminById(req.admin.id, {
        avatar: { url: photos.secure_url, publicId },
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


  
  

  async queryAdminWallet(_req: RequestType, res: Response, next: NextFunction) {
    try {
      const wallet = await this.paymentService.getAccount({
        walletType: "super_admin",
      });
      return res.status(httpStatus.OK).json({
        status: "success",
        wallet,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async updateAdminWallet(req: RequestType, res: Response, next: NextFunction) {
    try {
      const { walletMode } = req.body;
      const wallet = await this.paymentService.updateAccount(
        { walletType: "super_admin" },
        {
          walletMode,
        }
      );
      return res.status(httpStatus.OK).json({
        status: "success",
        wallet,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async getPagaWalletBalance(
    _req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      // const balance = await this.paymentService.getPagaWalletBalance(); // FIX_HERE
      // const data = {
      //   availableBalance: balance.availableBalance,
      //   totalBalance: balance.totalBalance,
      //   currency: balance.currency,
      //   balanceDateTimeUTC: balance.balanceDateTimeUTC,
      // };

      const data = {
        availableBalance: 0,
        totalBalance: 0,
        currency: "NGN",
        balanceDateTimeUTC: "",
      };
      return res.status(httpStatus.OK).json({
        status: "success",
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }


  

  async getDashboardSummary(
    _req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const users = (await this.userService.getAllUsers(
        {},
        {},
        true
      )) as User[];
      const transactions = (await this.paymentService.getTransactions(
        {},
        {},
        true
      )) as TransactionLogInterface[];
      const userWallet = await this.paymentService.queryUsersAccount({
        walletType: "user",
      });

      
      

      return res.status(httpStatus.OK).json({
        status: "success",
        summary: {
          users: {
            total: users.length,
            verified: users.filter(
              (user) => user.accountStatus.status === ACCOUNT_STATUS.ACTIVATED
            ).length,
            unverified: users.filter(
              (user) => user.accountStatus.status === ACCOUNT_STATUS.PENDING
            ).length,
            deactivated: users.filter(
              (user) => user.accountStatus.status === ACCOUNT_STATUS.DEACTIVATED
            ).length,
          },
          transactions: {
            total: transactions.length,
            successful: transactions.filter(
              (transaction) =>
                transaction.status === TRANSACTION_STATUS.SUCCESSFUL
            ).length,
            failed: transactions.filter(
              (transaction) => transaction.status === TRANSACTION_STATUS.FAILED
            ).length,
            pending: transactions.filter(
              (transaction) => transaction.status === TRANSACTION_STATUS.PENDING
            ).length,
          },
          wallet: {
            totalAvailableBalance: userWallet.reduce(
              (acc, curr) => acc + curr.availableBalance,
              0
            ),
            totalLedgerBalance: userWallet.reduce(
              (acc, curr) => acc + curr.ledgerBalance,
              0
            ),
            totalBalance: userWallet.reduce(
              (acc, curr) => acc + curr.availableBalance + curr.ledgerBalance,
              0
            ),
          },

          // gateWayBalance: {
          //   availableBalance: gateWayBalance.availableBalance,
          //   totalBalance: gateWayBalance.totalBalance,
          //   currency: gateWayBalance.currency,
          //   balanceDateTimeUTC: gateWayBalance.balanceDateTimeUTC,
          // },

          gateWayBalance: {
            availableBalance: 0,
            totalBalance: 0,
            currency: "NGN",
            balanceDateTimeUTC: "",
          },
      
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async getTransactionSummary(
    _req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const transactions = (await this.paymentService.getTransactions(
        {},
        {},
        true
      )) as TransactionLogInterface[];
      // const transactionSummary = transactions.reduce(
      //   (acc, curr) => {
      //     if (curr.status === TRANSACTION_STATUS.SUCCESSFUL) {
      //       acc.successful += 1;
      //     } else if (curr.status === TRANSACTION_STATUS.FAILED) {
      //       acc.failed += 1;
      //     } else if (curr.status === TRANSACTION_STATUS.PENDING) {
      //       acc.pending += 1;
      //     } else if (curr.category === TRANSACTION_CATEGORIES.WITHDRAWAL) {
      //       acc.withdrawal = +1;
      //     } else if (curr.category === TRANSACTION_CATEGORIES.GIFT) {
      //       acc.inAppTransfer += 1;
      //     } else if (
      //       curr.category === TRANSACTION_SOURCES.BANK_TRANSFER &&
      //       curr.type === TRANSACTION_TYPES.CREDIT
      //     ) {
      //       acc.topUp += 1;
      //     } else if (
      //       curr.category === TRANSACTION_CATEGORIES.LEDGER_TO_AVAILABLE
      //     ) {
      //       acc.ledgerToAvailable += 1;
      //     } else if (
      //       curr.category === TRANSACTION_CATEGORIES.AVAILABLE_TO_LEDGER
      //     ) {
      //       acc.availableToLedger += 1;
      //     }
      //     return acc;
      //   },
      //   {
      //     totalTransactionAmount: transactions.reduce(
      //       (acc, curr) => acc + curr.amount,
      //       0
      //     ),
      //     successful: 0,
      //     failed: 0,
      //     pending: 0,
      //     withdrawal: 0,
      //     inAppTransfer: 0,
      //     topUp: 0,
      //     ledgerToAvailable: 0,
      //     availableToLedger: 0,
      //   }
      // );
      // const gateWayBalance = await this.paymentService.getPagaWalletBalance(); FIX_HERE
      const summary = {
        totalTransactionAmount: transactions.reduce(
          (acc, curr) => acc + curr.amount,
          0
        ),
        totalTopUpAmount: transactions.reduce((acc, curr) => {
          if (
            curr.category === TRANSACTION_SOURCES.BANK_TRANSFER &&
            curr.type === TRANSACTION_TYPES.CREDIT
          ) {
            acc += curr.amount;
          }
          return acc;
        }, 0),
        totalWithdrawalAmount: transactions.reduce((acc, curr) => {
          if (curr.category === TRANSACTION_CATEGORIES.WITHDRAWAL) {
            acc += curr.amount;
          }
          return acc;
        }, 0),
        totalInAppTransferAmount: transactions.reduce((acc, curr) => {
          if (curr.category === TRANSACTION_CATEGORIES.GIFT) {
            acc += curr.amount;
          }
          return acc;
        }, 0),
        gateWayBalance: {
          availableBalance: 0,
          totalBalance: 0,
          currency: "NGN",
          balanceDateTimeUTC: "",
        },
      };
      return res.status(httpStatus.OK).json({
        status: "success",
        summary,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }
}
