import {
  BVN_STATUS,
  CARD_STATUS,
  NOTIFICATION_TYPE,
  TRANSACTION_SOURCES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} from "../../../config/constants";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Response } from "express";
import { PaginationModel, TransactionLogInterface } from "../../../index";
import { Document } from "mongoose";
import AdminService from "../../services/Admin.service";
import AppException from "../../exceptions/AppException";
import EmailService from "../../services/Email.service";
import EncryptionService from "../../services/Encryption.service";
import HelperClass from "../../utils/helper";
import NotificationService from "../../services/Notification.service";
import PaymentService from "../../services/payment.service";
import { RequestType } from "../middlewares/auth.middleware";
import { TRANSACTION_CATEGORIES } from "../../../config/constants";
import User from "../../database/models/User.model";
import UserService from "../../services/User.service";
import config from "../../../config/config";
import generateTxRef from "../../utils/generateTxRef";
import httpStatus from "http-status";
import moment from "moment";
import pick from "../../utils/pick";
import LoansService from "../../services/Loan.service";
import WorkService from "../../services/Work.service";

type ObjT = {
  [key: string]: {
    name: string;
    mobileOperatorCode: string;
    services: object[];
  };
};

const workService: WorkService = new WorkService();

export default class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly encryptionService: EncryptionService,
    private readonly adminService: AdminService,
    private readonly loanService: LoansService
  ) {}


  /**
   * Loan repayment checks
   * ------------------------
   * 1. Once my loan is over due try repayment
   * 2. 
   */

  /** Credit users account after money was sent to their account number */
  async creditAccount(req: RequestType, res: Response) {
    const event = req.body.event;
    const data: any = req.body.data;
    const reference = data.reference;
    let accountRef: string;
    let fee: number;

    data.idempotentKey = data.id;
    const proceed = await this.paymentService.controlTransaction(reference);

    if (event !== "charge.success") return res.sendStatus(200);
    if (!proceed) return res.sendStatus(200);

    const errorTracker = [
      `<strong>Account credit process for user account. Reference: ${data.id}</strong><br>`,
      `Credit request initiated for TrxId: ${reference}`,
    ];

    try {
      accountRef =
        data.virtual_bank_account_details.virtual_bank_account
          .account_reference;

      // Check Transaction Fee
      fee = Number(data.fee.toFixed(2));

      const accountInfo = await this.paymentService.queryAccountInfo({
        accountReference: accountRef,
      });

      errorTracker.push(
        `Account info retrieved successfully for user ${accountInfo.user}`
      );

      const transactionDump = await this.paymentService.createTransactionDump({
        data: data,
        user: accountInfo.user as string,
      });

      errorTracker.push(
        `Transaction data dumped successfully. DumpId ${transactionDump.id.toString()}`
      );

      // const loanCheck = loanService.checkLoanProfile(accountInfo.user);
      // console.log(loanCheck);

      const updatedBalance = Number(
        (accountInfo.availableBalance + Number(data.amount)).toFixed(2)
      );

      errorTracker.push(
        `New balance calculated successfully (${updatedBalance})`
      );

      // Confirm that there is no prior log of this particular transaction
      const getTransactions = (await this.paymentService.getTransactions(
        {
          reference: data.payment_reference,
        },
        {},
        true
      )) as (Document<unknown, any, TransactionLogInterface> &
        TransactionLogInterface)[];

      if (getTransactions.length > 0) {
        errorTracker.push(`Transaction previous log check returns true`);
        return res.send({ status: "SUCCESS", message: "Already logged" });
      }

      if (accountInfo.walletType === "super_admin") {
        await this.paymentService.updateAvailableBalance(updatedBalance, {
          admin: accountInfo.admin,
        });
      } else {
        await this.paymentService.updateAvailableBalance(updatedBalance, {
          user: accountInfo.user,
        });
      }

      data.amount = data.amount; // charge;

      let transaction;
      if (accountInfo.walletType === "super_admin") {
        transaction = await this.paymentService.createTransactionLog({
          amount: Number(data.amount),
          reference: data.id,
          admin: accountInfo.admin,
          initiator: "ADMIN",
          type: TRANSACTION_TYPES.CREDIT,
          source: TRANSACTION_SOURCES.BANK_TRANSFER,
          transactionDump: transactionDump.id,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          balanceAfterTransaction: updatedBalance,
          fee: 0,
          meta: {
            charge: fee,
            payerName: data.customer.name as string,
            bankName: data.customer.payerBankName as string,
            paymentReferenceNumber: reference,
            fundingPaymentReference: data.flw_ref as string,
            accountNumber: accountInfo.accountNumber,
            accountName: accountInfo.accountName,
            transactionType: "Deposit",
          },
        });
      } else {
        const user = await this.userService.getUserById(
          accountInfo.user as string
        );
        if (!user) throw Error("Opps! user was not found");
        transaction = await this.paymentService.createTransactionLog({
          amount: Number(data.amount),
          reference: data.reference,
          user: accountInfo.user,
          type: TRANSACTION_TYPES.CREDIT,
          source: TRANSACTION_SOURCES.BANK_TRANSFER,
          transactionDump: transactionDump.id,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          balanceAfterTransaction: updatedBalance,
          fee: 0,
          meta: {
            charge: fee,
            payerName: data.payer_bank_account.account_name as string,
            bankName: data.payer_bank_account.bank_name as string,
            paymentReferenceNumber: data.payer_bank_account.account_number,
            fundingPaymentReference: data.reference as string,
            accountNumber: accountInfo.accountNumber,
            accountName: accountInfo.accountName,
            transactionType: "Deposit",
          },
        });
      }

      await this.paymentService.createCredxEarnings({
        user: accountInfo.user,
        source: TRANSACTION_SOURCES.BANK_TRANSFER,
        amount: Number(data.amount),
        charge: fee,
        profit: 0,
        transaction: transaction.id,
        amountSpent: 0,
      });

      errorTracker.push(`Transaction logged successfully for user`);
      const message = `NGN${data.amount} was credited to your account (${data.payerDetails.payerName}/${data.payerDetails.payerBankName})`;

      let user;
      if (accountInfo.walletType === "super_admin") {
        user = await this.adminService.getAdminById(accountInfo.user as string);
      } else {
        user = await this.userService.getUserById(accountInfo.user as string);
      }

      if (user.email) {
        this.emailService.sendUserAccountCreditedEmail(
          user.email,
          user.firstName,
          message
        );
      }
      errorTracker.push(`Credit notification email sent`);
      errorTracker.push(`All required step completed successfully`);
      this.emailService.sendPaymentTrackingEmail(errorTracker.join(" <br> "));

      if (accountInfo.walletType !== "super_admin") {
        NotificationService.createNotification({
          body: message,
          user: accountInfo.user,
          title: "Transaction Notification",
          type: NOTIFICATION_TYPE.TRANSACTION,
        });
      }
      // mixPanel(EVENTS.DEPOSIT, transaction);
      return res.sendStatus(httpStatus.OK);
    } catch (err: any) {
      this.paymentService.logError({ stackTrace: errorTracker.join(" <br> ") });
      this.emailService.sendPaymentTrackingEmail(errorTracker.join(" <br> "));
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }
  }

  /** Perform in app transfers */
  async inAppTransfer(req: RequestType, res: Response, next: NextFunction) {
    const accountInfo = await this.paymentService.queryAccountInfoByUser(
      req.user.id
    );
    const proceed = await this.paymentService.controlTransaction(req.body);
    if (!proceed)
      return next(
        new AppException(
          "Duplicate transaction, withdrawal already initialized",
          httpStatus.BAD_REQUEST
        )
      );

    if (!accountInfo)
      return next(
        new AppException(
          "You cannot make gift someone until your account is fully setup",
          httpStatus.FORBIDDEN
        )
      );

    if (req.body.amount > accountInfo.availableBalance)
      return next(
        new AppException(
          `Oops! you don't have enough funds to perform this transaction`,
          httpStatus.BAD_REQUEST
        )
      );

    const updatedBalance = Number(
      (accountInfo.availableBalance - Number(req.body.amount)).toFixed(2)
    );

    const withdrawResponse = await this.paymentService.transferMoney(
      req.body,
      req.user
    );
    await this.paymentService.updateAvailableBalance(updatedBalance, {
      user: accountInfo.user,
    });

    // 08135289190

    const transactionDump = await this.paymentService.createTransactionDump({
      data: withdrawResponse,
      user: accountInfo.user,
    });

    // Store transaction
    const transaction = await this.paymentService.createTransactionLog({
      user: accountInfo.user,
      source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
      type: TRANSACTION_TYPES.DEBIT,
      amount: Number(req.body.amount),
      purpose: req.body.purpose || null,
      transactionDump: transactionDump.id,
      reference: withdrawResponse.reference,
      category: TRANSACTION_CATEGORIES.GIFT,
      status: TRANSACTION_STATUS.SUCCESSFUL,
      balanceAfterTransaction: updatedBalance,
      meta: {
        accountNumber: req.body.accountNumber,
        accountName: withdrawResponse.destinationAccountHolderNameAtBank,
        currency: withdrawResponse.currency,
        fee: withdrawResponse.fee,
        message: withdrawResponse.message,
        reference: withdrawResponse.reference,
        giftRecipient: withdrawResponse.recipient,
      },
    });

    // const message = `${req.body.amount} was debited from your account to (${withdrawResponse.destinationAccountHolderNameAtBank}/${withdrawResponse.username})`;
    const message = `You just transfered ₦${req.body.amount} to ${withdrawResponse.username}`;
    const user = await this.userService.getUserById(accountInfo.user as string);

    this.emailService.debitUserAccountEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      message
    );

    res.status(httpStatus.OK).send({
      status: "success",
      message,
      transaction,
    });
  }

  async getAccountInfo(req: RequestType, res: Response, next: NextFunction) {
    try {
      const accountInfo = await this.paymentService.queryAccountInfoByUser(
        req.user.id
      );

      const loanProfile = await this.loanService.checkLoanProfile(
        req.user._id as string
      );
      const userKyc = await this.paymentService.getUserKycInfo({
        user: req.user.id,
      });
      if (!userKyc) {
        await this.paymentService.updateUserKycInfo(
          { user: req.user.id },
          {
            user: req.user.id,
            bvn: {
              status: "pending",
            },
            document: {
              status: "pending",
            },
            tier: "tier1",
          }
        );
      }

      if (!accountInfo) {
        const newAccountInfo = await this.paymentService.setupAccount<User>(
          req.user,
          {}
        );
        return res.status(httpStatus.CREATED).json({
          status: "success",
          message: "Wallet information retrieved successfully",
          data: {
            ...newAccountInfo.toObject(),
            outstandingBalance: loanProfile.dept,
          },
        });
      }

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Wallet information retrieved successfully",
        data: {
          ...accountInfo.toObject(),
          outstandingBalance: loanProfile.dept,
        },
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }
  async addCard(req: RequestType, res: Response, next: NextFunction) {
    try {
      const { number, expYear, expMonth, cvv, idenpotentkey, pin } = req.body;

      const hostname = req.headers.host;

      console.log(hostname);
      const work = await workService.getWorkByUser(req.user._id as string);

      if (!work) throw new Error("work not found");

      const hash = await this.encryptionService.hashString(number);

      const cardExist = await this.paymentService.getCardByDetail({
        status: CARD_STATUS.ACTIVE,
        hash: hash,
      });

      if (cardExist) throw new Error("Card already exists");

      const card = await this.paymentService.intiateTransaction({
        email: work.email,
        reference: idenpotentkey,
        number: number,
        expiry_month: expMonth,
        expiry_year: expYear,
        cvv: cvv,
        fullname: work.email,
        user: work.user as string,
        pin: pin,
        callback: `https://web-production-f310.up.railway.app/api/v1/payment/verify/${hash}`,
      });

      const data = await this.paymentService.createCard({
        hash: hash,
        user: req.user.id,

        cardTransactionRef: card.data.tx_ref,
        cardType: card.data.card.type,
        cardRef: card.data.flw_ref,
        exp: card.data.card.expiry,

        customer: card.data.customer.id,
        currency: "NGN",
        cardLast4: card.data.card.last_4digits,
        cardFirst6: card.data.card.first_6digits,
      });

      return res.status(httpStatus.OK).json({
        status: "success",
        message: card.data.processor_response || "success",
        data,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }
  async verifyCard(req: RequestType, res: Response, next: NextFunction) {
    try {
      const { card, otp } = req.body;

      const cardExist = await this.paymentService.getCardById(card);
      if (!cardExist) throw new Error("Card does not exist");

      const verify = await this.paymentService.verifyCharge({
        otp: otp,
        flw_ref: cardExist.cardRef,
        type: "card",
      });

      return res.status(httpStatus.OK).json({
        status: "success",
        message: verify?.data?.processor_response || "success",
        data: verify.data,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async addCardCallback(req: RequestType, res: Response, next: NextFunction) {
    try {
      console.log("Callback was called");

      const hash = req.params.hash;
      const trRef = req.query.transaction_id;
      console.log(hash);
      console.log(trRef);

      if (req.query.status === "successful") {
        const transaction = await this.paymentService.verifyTransaction(
          trRef as string
        );
        const cardExist = await this.paymentService.getCardByDetail({
          hash: hash,
        });

        if (!cardExist) throw new Error("Card not found");
        await this.paymentService.updateCardById(cardExist._id, {
          cardToken: transaction.data.card.token,
          status: CARD_STATUS.ACTIVE,
        });
      }

      return res.status(httpStatus.OK).send();
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async updateUserKyc(req: RequestType, res: Response, next: NextFunction) {
    try {
      const { bvn } = req.body;
      if (req?.user?.kyc?.bvn?.status === "approved") {
        return res
          .status(httpStatus.OK)
          .json({ status: "success", message: "BVN already verified" });
      }
      const data = await this.userService.validateBvn(bvn);
      console.log(data);
      if (data.error) throw new Error(data.message);
      req.body.kyc = {
        bvn: {
          status: data.error ? BVN_STATUS.FAILED : BVN_STATUS.VERIFIED,
          bvn: await this.encryptionService.hashPassword(req.body.bvn),
          // bvn: req.body.bvn,
        },
        tier: "tier3" as const,
      };
      // const userKyc = await this.paymentService.updateUserKycInfo(
      //   { user: req.user.id },
      //   req.body
      // );
      const user = await this.userService.updateUserById(req.user.id, req.body);
      return res
        .status(httpStatus.OK)
        .json({ status: "success", message: "KYC updated", data: user });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async withdrawMoney(req: RequestType, res: Response, next: NextFunction) {
    try {
      const accountInfo = await this.paymentService.queryAccountInfoByUser(
        req.user.id
      );
      const proceed = await this.paymentService.controlTransaction(req.body);
      if (!proceed)
        throw new Error(
          "Duplicate transaction, withdrawal already initialized"
        );
      if (!accountInfo)
        throw new Error(
          "You cannot make transfers until your account is fully setup"
        );
      if (accountInfo.locked === true)
        throw new Error(
          "Oops!, your account is locked, please contact support"
        );
      let charge = Number(
        Number(config.paymentProcessing.withdrawalCharge).toFixed(2)
      );
      const userKyc = await this.paymentService.getUserKycInfo({
        user: accountInfo.user,
      });
      if (!userKyc) throw new Error("Please complete your KYC to proceed");
      if (userKyc.tier === "tier1" && req.body.amount > 100000)
        throw new Error(
          "You cannot withdraw more than 100,000 NGN at a go, please upgrade your account to tier 3 by adding your bvn to proceed"
        );
      if (Number(req.body.amount) + charge <= accountInfo.availableBalance) {
        const processingCost = Number(
          config.paymentProcessing.withdrawalProcessingCost
        );
        const profit = charge - processingCost;
        const updatedBalance = Number(
          (
            accountInfo.availableBalance -
            Number(req.body.amount) -
            charge
          ).toFixed(2)
        );
        const withdrawResponse = await this.paymentService.withdrawMoney(
          req.body,
          req.user
        );

        charge =
          withdrawResponse.fee && withdrawResponse.fee === 0 ? 0 : charge;

        // calculateReferral
        if (req.user.referrer) {
          const rUser = await this.userService.getUserById(req.user.referrer);
          if (!rUser) throw Error("Referrer Credit Error");
        }

        await this.paymentService.updateAvailableBalance(
          updatedBalance - charge,
          {
            user: accountInfo.user,
          }
        );
        const transactionDump = await this.paymentService.createTransactionDump(
          {
            data: withdrawResponse,
            user: accountInfo.user,
          }
        );
        // Store transaction
        const transaction = await this.paymentService.createTransactionLog({
          user: accountInfo.user,
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          type: TRANSACTION_TYPES.DEBIT,
          amount: Number((Number(req.body.amount) + charge).toFixed(2)),
          fee: charge,
          purpose: req.body.purpose || null,
          transactionDump: transactionDump.id,
          reference: withdrawResponse?.reference,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          category: TRANSACTION_CATEGORIES.WITHDRAWAL,
          balanceAfterTransaction: updatedBalance,
          meta: {
            accountNumber: req.body.accountNumber,
            accountName: withdrawResponse.destinationAccountHolderNameAtBank,
            currency: withdrawResponse.currency,
            fee: charge,
            message: withdrawResponse.message,
            reference: withdrawResponse?.reference,
            transactionType: "Withdrawal",
          },
        });

        await this.paymentService.createCredxEarnings({
          user: accountInfo.user,
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          amount: Number(req.body.amount),
          charge,
          profit:
            withdrawResponse.fee && withdrawResponse.fee === 0 ? 0 : profit,
          transaction: transaction.id,
          amountSpent:
            withdrawResponse.fee && withdrawResponse.fee === 0
              ? 0
              : processingCost,
        });
        const message = `NGN${req.body.amount} was debited from your account to (${withdrawResponse.destinationAccountHolderNameAtBank}/${req.body.accountNumber})`;
        const user = await this.userService.getUserById(
          accountInfo.user as string
        );

        this.emailService.debitUserAccountEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          message
        );

        NotificationService.createNotification({
          user: accountInfo.user,
          title: "Transaction Notification",
          body: message,
          type: NOTIFICATION_TYPE.TRANSACTION,
        });
        // mixPanel(EVENTS.WITHDRAW, transaction);
        res.send(transaction);
      } else {
        return next(
          new AppException(
            `Oops! you don't have enough funds ${
              Number(req.body.amount) + charge
            } to perform this transaction`,
            httpStatus.BAD_REQUEST
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof AppException || err instanceof Error) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getBankList(_req: RequestType, res: Response, next: NextFunction) {
    try {
      const banks = await this.paymentService.getInAppBankList();
      if (banks.length !== 0) return res.send(banks);
      const bankList = await this.paymentService.getBanks();
      res.send(bankList);
    } catch (err: any) {
      return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async validateAccount(req: RequestType, res: Response, next: NextFunction) {
    try {
      const details = await this.paymentService.validateAccountNumber(req.body);
      res.send(details);
    } catch (err: any) {
      return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async validateUsername(req: RequestType, res: Response, next: NextFunction) {
    try {
      req.body.walletCode !== undefined
        ? (req.body.username = req.body.walletCode)
        : null;
      const details = await this.paymentService.validateUsername(
        req.body.username
      );
      res.send(details);
    } catch (err: any) {
      return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async getMobileOperators(
    _req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const mobileOperatorServices: {
        name: string;
        mobileOperatorCode: string;
        services: object[];
      }[] = [];

      const mobileOperatorServicesObject = mobileOperatorServices.reduce(
        (obj: ObjT, item) => {
          obj[item.name] = item;
          return obj;
        },
        {}
      );
      res.send(mobileOperatorServicesObject);
    } catch (err: any) {
      return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async buyAirtime(req: RequestType, res: Response, next: NextFunction) {
    try {
      const accountInfo = await this.paymentService.queryAccountInfoByUser(
        req.user.id
      );
      if (!accountInfo)
        throw new Error(
          "You cannot perform this action until your account is fully setup"
        );
      if (accountInfo.locked === true)
        throw new Error(
          "Oops!, your account is locked, please contact support"
        );
      if (req.body.amount <= accountInfo.availableBalance) {
        const updatedBalance = Number(
          (accountInfo.availableBalance - Number(req.body.amount)).toFixed(2)
        );

        const airtimeResponse = await this.paymentService.buyAirtime(req.body);
        await this.paymentService.updateAvailableBalance(updatedBalance, {
          user: accountInfo.user,
        });

        const transactionDump = await this.paymentService.createTransactionDump(
          {
            data: airtimeResponse,
            user: accountInfo.user,
          }
        );
        // Store transaction
        const transaction = await this.paymentService.createTransactionLog({
          user: accountInfo.user,
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          type: TRANSACTION_TYPES.DEBIT,
          amount: Number(req.body.amount),
          purpose: "Airtime purchase",
          transactionDump: transactionDump.id,
          reference: airtimeResponse?.reference ?? airtimeResponse.requestId,
          category: TRANSACTION_CATEGORIES.AIRTIME_PURCHASE,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          balanceAfterTransaction: updatedBalance,
          meta: {
            payerName: `Airtime/${req.body.phone}`,
            phoneNumber: req.body.phone,
            message: "Airtime purchase was successfull",
            reference: airtimeResponse?.reference ?? airtimeResponse.requestId,
          },
        });

        await this.paymentService.createCredxEarnings({
          user: accountInfo.user,
          amount: req.body.amount,
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          charge: 0,
          profit: Number(
            (Number(Number(1.5) / 100) * req.body.amount).toFixed(2)
          ),
          transaction: transaction.id,
          amountSpent: 0,
        });
        // mixPanel(EVENTS.WITHDRAW, transaction);
        res.send(transaction);
      } else throw new Error("Insufficient balance");
    } catch (err: any) {
      return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async getVariations(req: RequestType, res: Response, next: NextFunction) {
    try {
      const variationsResponse = await this.paymentService.getVariations(
        req.body
      );

      res
        .status(httpStatus.OK)
        .json({ status: "success", data: variationsResponse });
    } catch (err: unknown) {
      if (err instanceof Error)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async validateCustomerDetails(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const utilitiesResponse =
        await this.paymentService.validateCustomerReference(req.body);
      res
        .status(httpStatus.OK)
        .json({ status: "success", data: utilitiesResponse });
    } catch (err: unknown) {
      if (err instanceof Error)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async purchaseUtilities(req: RequestType, res: Response, next: NextFunction) {
    try {
      if (req.body.amount < 1) throw new Error(`Amount must be greater than 1`);
      const accountInfo = await this.paymentService.queryAccountInfoByUser(
        req.user.id
      );
      if (!accountInfo)
        throw new Error(
          `You can't perform this action until your account is fully setup`
        );
      if (accountInfo.locked === true)
        throw new Error(
          "Oops!, your account is locked, please contact support"
        );
      if (req.body.amount <= accountInfo.availableBalance) {
        const profit = HelperClass.calculateProfit(
          req.body.amount,
          req.body.serviceID
        );
        const category = HelperClass.getCategory(req.body.serviceID);

        const updatedBalance = Number(
          (accountInfo.availableBalance - Number(req.body.amount)).toFixed(2)
        );

        const utilitiesResponse = await this.paymentService.purchaseUtilities(
          req.body
        );
        await this.paymentService.updateAvailableBalance(updatedBalance, {
          user: accountInfo.user,
        });
        const transactionDump = await this.paymentService.createTransactionDump(
          {
            data: utilitiesResponse,
            user: accountInfo.user,
          }
        );

        // Store transaction
        const transaction = await this.paymentService.createTransactionLog({
          user: accountInfo.user,
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          type: TRANSACTION_TYPES.DEBIT,
          amount: Number(req.body.amount),
          purpose: "Utilities purchase",
          transactionDump: transactionDump.id,
          reference: utilitiesResponse.reference,
          category: category,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          balanceAfterTransaction: updatedBalance,
          meta: {
            payerName: `Utilities/${req.user.firstName} ${req.user.lastName}`,
            phoneNumber: req.body.phone,
            message: utilitiesResponse.message,
            reference: utilitiesResponse.reference,
          },
        });
        await this.paymentService.createCredxEarnings({
          user: accountInfo.user,
          amount: req.body.amount,
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          charge: 0,
          profit,
          transaction: transaction.id,
          amountSpent: 0,
        });
        // mixPanel(EVENTS.WITHDRAW, transaction);
        res.send(transaction);
      } else throw new Error("Oops!, Insufficient balance");
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async cableUtilities(_req: RequestType, res: Response, next: NextFunction) {
    try {
      // -const utilityProvider = await this.paymentService.getUtilitiesProviders();
      // -const filteredCableUtilities = utilityProvider.merchants.filter(
      //   (utility: any) =>
      //     utility.name === "DStv" ||
      //     utility.name === "GOtv" ||
      //     utility.name === "NTA-Star TV Network Ltd"
      // );

      const cableSubUtility: object[] = [];
      // const referenceNumber = req.query.referenceNumber
      //   ? req.query.referenceNumber
      //   : (HelperClass.generateRandomChar(10, 'num') as string);

      // FIX_HERE

      // await Promise.all(
      //   filteredCableUtilities.map(async (cable) => {
      //     const cableUtility = {
      //       name: cable.name,
      //       displayName: cable.displayName,
      //       uuid: cable.uuid,
      //       services: [] as object[],
      //     };
      //     const providers =
      //       await this.paymentService.getUtilitiesProvidersServices(cable.uuid);
      //     cableUtility.services = providers.services;
      //     cableSubUtility.push(cableUtility);
      //   })
      // );

      res.status(httpStatus.OK).json({
        status: "success",
        cableSubUtility,
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async electricityUtilities(
    _req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const utilityProvider = await this.paymentService.getUtilitiesProviders();
      res.status(httpStatus.OK).json({
        status: "success",
        utilityProvider,
      });

      res.status(httpStatus.OK).json({
        status: "success",
      });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async getTransactions(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = pick(req.query, [
        "user",
        "type",
        "source",
        "category",
        "initiator",
      ]);

      if ("type" in filter) {
        filter.type !== "all" ? filter.type : delete filter.type;
      }
      if ("category" in filter) {
        filter.category !== "all" ? filter.category : delete filter.category;
      }
      if ("source" in filter) {
        filter.source !== "all" ? filter.source : delete filter.source;
      }

      let createdAt: object = {};
      if (req.query.startDate && req.query.endDate) {
        createdAt = {
          $gte: moment(req.query.startDate as string).startOf("day"),
          $lte: moment(req.query.endDate as string).endOf("day"),
        };
      } else if (req.query.startDate) {
        createdAt = {
          $gte: moment(req.query.startDate as string).startOf("day"),
        };
      } else if (req.query.endDate) {
        createdAt = { $lte: moment(req.query.endDate as string).endOf("day") };
      }

      if (Object.keys(createdAt).length !== 0)
        Object.assign(filter, { createdAt });

      const options = pick(req.query, ["orderBy", "limit", "page", "populate"]);
      const transactions = await this.paymentService.getTransactions(
        filter,
        options,
        req.query.ignorePaginate as unknown as boolean,
        req.user
      );
      res.status(httpStatus.OK).json({ status: "success", transactions });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async getTransaction(req: RequestType, res: Response, next: NextFunction) {
    try {
      const transaction = (await this.paymentService.getTransactions({
        id: req.params.id,
      })) as PaginationModel<TransactionLogInterface>;
      res
        .status(httpStatus.OK)
        .json({ status: "success", transaction: transaction.data[0] });
    } catch (err: unknown) {
      if (err instanceof AppException || err instanceof Error) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async saveTransactionPin(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { pin } = req.body;
      const account = await this.paymentService.queryAccountInfoByUser(
        req.user.id
      );
      if (!account) {
        throw new Error("Account not found");
      }

      if (account.transactionPin) throw new Error("PIN already exists");
      const hashedPin = await this.encryptionService.hashString(pin);
      account.transactionPin = hashedPin;
      await account.save();
      res.status(httpStatus.OK).json({ status: "success", account });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async verifyPin(req: RequestType, res: Response, next: NextFunction) {
    try {
      const { pin } = req.body;
      const hashedPin = await this.encryptionService.hashString(pin);
      const account = await this.paymentService.queryAccountInfo({
        user: req.user._id,
      });

      if (!account.transactionPin) {
        throw new Error("Oops! PIN not set");
      }

      if (hashedPin != account.transactionPin) {
        throw new Error("Oops! Invalid pin");
      }
      if (!account) {
        throw new Error("Oops! Invalid pin");
      }
      res.status(httpStatus.OK).json({ status: "success", isPinValid: true });
    } catch (err: any) {
      return next(
        new AppException(err.message, err.status || httpStatus.BAD_REQUEST)
      );
    }
  }

  async sendPinResetEmail(req: RequestType, res: Response, next: NextFunction) {
    try {
      const user = await this.userService.getUserById(req.user.id);
      if (!user) throw new Error("User not found");
      const token = HelperClass.generateRandomChar(6, "num");
      const hashedToken = await this.encryptionService.hashString(token);
      user.resetToken = hashedToken;
      user.resetTokenExpiresAt = moment().add(10, "minutes").toDate();
      await user.save();

      await this.emailService.sendTxPinResetEmail(
        `${HelperClass.upperCase(user.lastName)} ${HelperClass.capitalCase(
          user.firstName
        )}`,
        user.email,
        token
      );
      res.status(httpStatus.OK).json({
        status: "success",
        message: "A reset pin token has been sent to your email address",
      });
    } catch (err: unknown) {
      if (err instanceof AppException || err instanceof Error)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async resetPin(req: RequestType, res: Response, next: NextFunction) {
    try {
      const { pin, token } = req.body;
      const hashedToken = await this.encryptionService.hashString(token);
      const user = await User.findOne({
        resetToken: hashedToken,
        resetTokenExpiresAt: { $gte: moment().toDate() },
      });
      if (!user) {
        throw new Error("Invalid or expired token");
      }
      user.resetTokenExpiresAt = undefined;
      user.resetToken = undefined;
      user.save();
      const hashedPin = await this.encryptionService.hashString(pin);
      const account = await this.paymentService.queryAccountInfoByUser(
        req.user.id
      );
      if (!account) {
        throw new Error("Account not found");
      }
      account.transactionPin = hashedPin;
      await account.save();
      res.status(httpStatus.OK).json({ status: "success", account });
    } catch (err: unknown) {
      if (err instanceof AppException || err instanceof Error)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async acceptPayment(req: RequestType, res: Response, next: NextFunction) {
    try {
      const proceed = await this.paymentService.controlTransaction(req.body);
      if (!proceed)
        return res.status(200).json({
          status: "success",
          message: "Transaction already processed",
        });
      const userWalletInfo = await this.paymentService.queryAccountInfo({
        username: req.body.walletCode,
      });
      if (!userWalletInfo) throw new Error("Wallet not found");
      req.body.amount = Number(req.body.amount);
      if (req.body.amount > userWalletInfo.availableBalance)
        throw new Error("Insufficient balance");
      const updatedUserBalance = Number(
        (userWalletInfo.availableBalance + req.body.amount).toFixed(2)
      );
      await this.paymentService.updateAvailableBalance(updatedUserBalance, {
        id: userWalletInfo.id,
        username: userWalletInfo.username,
      });
      const transaction = await this.paymentService.createTransactionLog({
        amount: req.body.amount,
        type: TRANSACTION_TYPES.CREDIT,
        user: userWalletInfo.user,
        purpose:
          req.body.purpose ||
          `Payment from ${req.body.source} wallet by ${req.body.payerName}`,
        category: TRANSACTION_CATEGORIES.CROSS_APP_TRANSFER,
        balanceAfterTransaction: updatedUserBalance,
        status: TRANSACTION_STATUS.SUCCESSFUL,
        pending: false,
        reference: generateTxRef(24, "num"),
        source: TRANSACTION_SOURCES.USER_TRANSFER,
        meta: {
          payerName: req.body.payerName,
          from: req.body.provider,
        },
      });
      await this.paymentService.createCredxEarnings({
        user: userWalletInfo.user,
        amount: req.body.amount,
        source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
        charge: 0,
        profit: 0,
        transaction: transaction.id,
        amountSpent: 0,
      });
      const message = `${req.body.amount} NGN was credited to your wallet by ${req.body.payerName}`;
      const recipient = await this.userService.getUserById(
        userWalletInfo.user as string
      );
      this.emailService.sendUserAccountCreditedEmail(
        recipient.email,
        `${recipient.firstName} ${recipient.lastName}`,
        message
      );
      NotificationService.createNotification({
        user: userWalletInfo.user,
        title: "Transaction Notification",
        body: message,
        type: NOTIFICATION_TYPE.TRANSACTION,
      });
      res.status(httpStatus.OK).json(transaction);
    } catch (err: unknown) {
      if (err instanceof AppException || err instanceof Error)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }

  async chargeUserWallet(req: RequestType, res: Response, next: NextFunction) {
    try {
      const proceed = await this.paymentService.controlTransaction(req.body);
      if (!proceed)
        return res.status(200).json({
          status: "success",
          message: "Transaction already processed",
        });
      const userWalletInfo = await this.paymentService.queryAccountInfo({
        user: req.user.id,
      });
      if (!userWalletInfo) throw new Error("Wallet not found");
      req.body.amount = Number(req.body.amount);
      if (req.body.amount > userWalletInfo.availableBalance)
        throw new Error("Insufficient balance");
      const updatedUserBalance = Number(
        (userWalletInfo.availableBalance - req.body.amount).toFixed(2)
      );
      await this.paymentService.updateAvailableBalance(updatedUserBalance, {
        id: userWalletInfo.id,
        username: userWalletInfo.username,
      });
      const transaction = await this.paymentService.createTransactionLog({
        amount: req.body.amount,
        type: TRANSACTION_TYPES.DEBIT,
        user: userWalletInfo.user,
        purpose:
          req.body.purpose ||
          `Transfer to ${req.body.to} wallet with wallet number ${req.body.walletCode}/${req.body.destinationHolderName}`,
        category: TRANSACTION_CATEGORIES.CROSS_APP_TRANSFER,
        balanceAfterTransaction: updatedUserBalance,
        status: TRANSACTION_STATUS.SUCCESSFUL,
        pending: false,
        reference: generateTxRef(24, "num"),
        source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
        meta: {
          payerName: req.body.payerName,
          bankName: req.body.to,
          destinationHolderName: req.body.destinationHolderName,
          destinationWalletCode: req.body.walletCode,
        },
      });
      await this.paymentService.createCredxEarnings({
        user: userWalletInfo.user,
        amount: req.body.amount,
        source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
        charge: 0,
        profit: 0,
        transaction: transaction.id,
        amountSpent: 0,
      });
      const message = `${req.body.amount} NGN was debited from your wallet`;
      const user = await this.userService.getUserById(
        userWalletInfo.user as string
      );
      this.emailService.sendUserAccountCreditedEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        message
      );
      NotificationService.createNotification({
        user: userWalletInfo.user,
        title: "Transaction Notification",
        body: message,
        type: NOTIFICATION_TYPE.TRANSACTION,
      });
      res.status(httpStatus.OK).json(transaction);
    } catch (err: unknown) {
      if (err instanceof AppException || err instanceof Error)
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
    }
  }
}
