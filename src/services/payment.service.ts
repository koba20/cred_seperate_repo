import {
  ErrorTrackerType,
  FlutterResponse,
  PaginationModel,
  purchaseUtilitiesType,
  ScheduleInterface,
  ValidateCustomerReference,
} from "../../index";
import {
  NOTIFICATION_TYPE,
  TRANSACTION_CATEGORIES,
  TRANSACTION_SOURCES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} from "../../config/constants";
import { SinntsEarningType } from "../../index";
import {
  TransactionDumpInterface,
  TransactionLogInterface,
  User,
  inAppTransfer,
} from "../../index";

import Account from "../database/models/Account.model";
import Admin from "../database/models/Admin.model";
import Bank from "../database/models/wallet/Bank.model";
import { CURRENCIES } from "../../config/constants";
import EmailService from "./Email.service";
import ErrorTracker from "../database/models/wallet/ErrorTracker.model";
import RegulateTransaction from "../database/models/wallet/RegulateTransaction.model";
import SinntsEarning from "../database/models/wallet/SinntsEarning.model";
import TransactionDump from "../database/models/wallet/TransactionDump.model";
import TransactionLog from "../database/models/wallet/TransactionLog.model";
import UserKyc from "../database/models/wallet/UserKyc.model";
import UserService from "./User.service";
import config from "../../config/config";
import { createNotification } from "../utils/notification";
import generateTxRef from "../utils/generateTxRef";

import mongoose from "mongoose";
import NotificationService from "./Notification.service";
import apiGatewayConfig from "../../config/config";
import VtpassClient from "./vtpass/Vtpass.client";
import KoraClient from "./kora/Kora.client";
import HelperClass from "../utils/helper";
import EncryptionService from "./Encryption.service";
import FlutterwaveClient from "./flutterwave/Flutterwave.client";
import TokenizedCard from "../database/models/wallet/Card.model";

export default class PaymentService {
  constructor(
    private readonly flutterwave: FlutterwaveClient,
    private readonly kora: KoraClient,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
    private readonly vtpass: VtpassClient,
    private readonly encryptionService: EncryptionService
  ) {}

  async getTransactions(
    filter: Partial<TransactionLogInterface>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePaginate = false,
    actor?: User
  ) {
    if (actor) {
      Object.assign(filter, { user: actor.id });
    }

    const data = ignorePaginate
      ? await TransactionLog.find(filter).sort({ createdAt: "desc" })
      : await TransactionLog.paginate(filter, options);
    return data;
  }

  async createTransactionLog(data: Partial<TransactionLogInterface>) {
    const transaction = await TransactionLog.create(data);
    return transaction;
  }

  async updateAvailableBalance(balance: number, filter: Partial<Account>) {
    const account = await this.getAccount(filter);
    if (!account) throw new Error(`Account does not exist`);
    Object.assign(account, {
      availableBalance: balance,
    });
    await account.save();
    return account;
  }

  async updateLedgerBalance(balance: number, filter: Partial<Account>) {
    const account = await this.getAccount(filter);
    if (!account) throw new Error(`Account does not exist`);
    Object.assign(account, {
      ledgerBalance: balance,
    });
    await account.save();
    return account;
  }

  async updateReservedBalance(balance: number, filter: Partial<Account>) {
    const account = await this.getAccount(filter);
    if (!account) throw new Error(`Account does not exist`);
    Object.assign(account, {
      reservedBalance: balance,
    });
    await account.save();
    return account;
  }

  async getAccount(
    condition: Partial<Account>
  ): Promise<mongoose.Document & Account> {
    const account = await Account.findOne(condition);
    return account;
  }

  async queryUsersAccount(filter: Partial<Account>): Promise<Account[]> {
    const account = await Account.find(filter);
    return account;
  }

  async updateAccount(condition: Partial<Account>, data: Partial<Account>) {
    const account = await Account.findOne(condition);
    if (!account) throw new Error(`Account does not exist`);
    Object.assign(account, data);
    await account.save();
    return account;
  }

  async controlTransaction(reference: string): Promise<boolean> {
    const exist = await RegulateTransaction.findOne({
      idempotentKey: reference,
    });
    if (exist) return false;
    await RegulateTransaction.create({ idempotentKey: reference });
    return true;
  }

  async queryAccountInfoByUser(user: string) {
    const account = await Account.findOne({ user });
    return account;
  }

  async queryAccountInfo(filter: Partial<Account>) {
    const account = await Account.findOne(filter);
    return account;
  }

  async createTransactionDump(
    createBody: Partial<TransactionDumpInterface>
  ): Promise<TransactionDumpInterface> {
    const transactionDump = await TransactionDump.create(createBody);
    return transactionDump;
  }

  async createCredxEarnings(
    data: Partial<SinntsEarningType>
  ): Promise<SinntsEarningType> {
    const earnings = await SinntsEarning.create(data);
    return earnings;
  }

  async logError(data: Partial<ErrorTrackerType>): Promise<ErrorTrackerType> {
    const error = await ErrorTracker.create(data);
    return error;
  }

  async transferMoney(
    body: Partial<inAppTransfer>,
    actor: User,
    account = "AVAILABLE_BALANCE",
    payer?: string
  ) {
    body.reference = generateTxRef(16, "num");
    const userAccount = await this.getAccount({
      username: body.username,
      deletedAt: null,
    });
    if (!userAccount) Error("Account does not exist");
    if (userAccount?.lock?.isLocked === true)
      throw new Error("Oops!, your account is locked, please contact support");

    account !== "AVAILABLE_BALANCE"
      ? await this.updateLedgerBalance(
          (userAccount.ledgerBalance ?? 0) + body.amount,
          {
            username: userAccount.username,
          }
        )
      : await this.updateAvailableBalance(
          (userAccount.availableBalance ?? 0) + body.amount,
          {
            username: userAccount.username,
          }
        );

    const transactionDump = await this.createTransactionDump({
      user: userAccount.user,
      data: body,
    });

    await this.createTransactionLog({
      user: userAccount.user,
      amount: body.amount,
      source: TRANSACTION_SOURCES.USER_TRANSFER,
      type: TRANSACTION_TYPES.CREDIT,
      transactionDump: transactionDump.id,
      reference: body.reference,
      purpose: body.purpose || null,
      category: body.transactionCategory
        ? body.transactionCategory
        : TRANSACTION_CATEGORIES.GIFT,
      status: TRANSACTION_STATUS.SUCCESSFUL,
      balanceAfterTransaction:
        account !== "AVAILABLE_BALANCE"
          ? userAccount.ledgerBalance + body.amount
          : (userAccount.availableBalance ?? 0) + body.amount,
      fee: 0,
      meta: {
        username: userAccount.username,
        payerName: payer ? payer : `${actor.firstName} ${actor.lastName}`,
        currency: "NGN",
        fee: 0,
        message: "Transfer within (Charge: 0)",
        reference: body.reference,
      },
    });

    const message = `Hey, you just received a gift worth ₦${body.amount} from ${actor.firstName} ${actor.lastName}`;
    const recipient = await this.userService.getUserById(
      userAccount.user as string
    );
    this.emailService.sendUserAccountCreditedEmail(
      recipient.email,
      `${recipient.firstName} ${recipient.lastName}`,
      message
    );
    NotificationService.createNotification({
      user: userAccount.user as string,
      title: "Gift Notification",
      body: message,
      type: NOTIFICATION_TYPE.TRANSACTION,
    });
    const response = {
      reference: body.reference as string,
      username: userAccount.username,
      email: actor.email,
      destinationAccountHolderNameAtBank: `${recipient.firstName} ${recipient.lastName}`,
      currency: "GIFT",
      fee: 0,
      message: "Transfer within App (Charge: 0)",
      recipient,
    };
    return response;
  }

  async intiateTransaction(_config: {
    user: string;
    number: string;
    fullname: string;
    email: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
    pin: string;
    callback: string;
    reference: string;
  }): Promise<FlutterResponse> {
    return await this.flutterwave.chargeCard({
      card_number: _config.number,
      cvv: _config.cvv,
      expiry_month: _config.expiry_month,
      expiry_year: _config.expiry_year,
      currency: "NGN",
      amount: "50",
      fullname: _config.fullname,
      email: _config.email,
      tx_ref: _config.reference,
      redirect_url: _config.callback,
      authorization: {
        mode: "pin",
        pin: _config.pin,
      },
    });
  }

  async verifyCharge(_config: {
    otp: string;
    flw_ref: string;
    type: string;
  }): Promise<FlutterResponse> {
    return await this.flutterwave.verifyCharge(_config);
  }

  async verifyTransaction(id: string): Promise<FlutterResponse> {
    return await this.flutterwave.verifyTransaction(id);
  }

  async createCard(data: Partial<TokenizedCard>): Promise<TokenizedCard> {
    const card = await this.getCardByDetail({ hash: data.hash });
    if (card) {
      Object.assign(card, data);
      return await card.save();
    }
    const result = await TokenizedCard.create(data);
    return result;
  }

  async getCardByDetail(
    detail: Partial<TokenizedCard>
  ): Promise<mongoose.Document & TokenizedCard> {
    const result = await TokenizedCard.findOne(detail);
    return result;
  }
  async getCardById(id: string): Promise<TokenizedCard> {
    const result = await TokenizedCard.findById(id);
    return result;
  }

  async getUserCards(user: string) {
    const data = await TokenizedCard.find({ user: user });
    return data;
  }

  async updateCardById(card: string, updateBody: Partial<TokenizedCard>) {
    const data = await TokenizedCard.findByIdAndUpdate(card, updateBody);
    return data;
  }

  async getAllCards(
    filter: Partial<TokenizedCard>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePagination = false
  ) {
    const data = ignorePagination
      ? await TokenizedCard.find(filter)
      : await TokenizedCard.paginate(filter, options);
    return data;
  }

  async setupAccount<T extends User>(
    userData: Partial<T>,
    account?: { availableBalance?: number; ledgerBalance?: number }
  ) {
    let _userBvn = this.encryptionService.decodeString(
      userData.kyc.bvn.bvn,
      userData.id
    );

    if (apiGatewayConfig.env == "development") {
      _userBvn = HelperClass.generateRandomBVN();
    }

    const mData = {
      account_name: `${userData.firstName} ${userData.lastName}`,
      account_reference: userData._id as string,
      permanent: true,
      bank_code: "000",
      kyc: {
        bvn: _userBvn,
      },
      customer: {
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
      },
    };

    const accountInfo = await this.kora.createAccount(mData);
    if (!accountInfo.error) {
      const object: { [key: string]: string | number } = {
        accountNumber: accountInfo.data.account_number,
        username: userData?.username,
        accountReference: userData.id,
        accountName: mData.account_name,
        bankName: accountInfo.data.bank_name,
        bankReferenceNumber: accountInfo.data.bank_code,
        callbackUrl: "",
        accountRef: accountInfo.data.unique_id,
        availableBalance:
          account.availableBalance !== null || undefined
            ? account.availableBalance
            : 0,
        ledgerBalance:
          account.ledgerBalance !== null || undefined
            ? account.ledgerBalance
            : 0,
      };

      userData instanceof Admin
        ? ((object.admin = userData._id),
          (object.walletType = "super_admin"),
          (object.user = userData._id))
        : ((object.user = userData._id as string),
          (object.walletType = "user"));

      const createAccount = await Account.create(object);

      await createNotification({
        body: `A dedicated account setup for you`,
        user: userData._id as string,
        title: "Dedicated Bank Account",
        type: NOTIFICATION_TYPE.WALLET,
      });
      await createNotification({
        body: `You can now fund your ${config.appName} wallet, receive money and send money through your personal bank account`,
        user: userData._id as string,
        title: "Dedicated Bank Account",
        type: NOTIFICATION_TYPE.WALLET,
      });
      return createAccount;
    }
    await createNotification({
      body: `Could not generate a dedicated bank account for you due to ${
        accountInfo.errorMessage || accountInfo.statusMessage
      }. Update your profile and your dedicated bank account will be generated within 24hours`,
      user: userData.id,
      title: "Dedicated Bank Account",
      type: NOTIFICATION_TYPE.WALLET,
    });
    throw new Error(
      `Could not generate a dedicated bank account for you due to ${
        accountInfo.errorMessage || accountInfo.statusMessage
      }. Update your profile to get your dedicated bank account`
    );
  }

  async withdrawMoney(
    body: {
      accountBank: string;
      accountNumber: string;
      amount: number;
      narration: string;
    },
    actor: User
  ) {
    Object.assign(body, {
      firstName: actor.firstName,
      lastName: actor.lastName,
    });

    const withdrawData = {
      type: "bank_account",
      amount: body.amount,
      currency: "NGN",
      narration: body.narration,
      bank_account: {
        bank: body.accountBank,
        account: body.accountNumber,
      },
      customer: {
        name: actor.firstName,
        email: actor.email,
      },
    };

    const withdrawal = await this.kora.withdrawFunds(withdrawData);
    if (withdrawal.error) throw new Error(withdrawal.message);
    return withdrawal;
  }

  async getBanks() {
    const banks = await this.kora.getBanks();
    return banks;
  }

  async getTransferFee(amount: number) {
    const fee = await this.kora.getTransferFee(amount);
    const data = fee.data[0];
    return {
      ...data,
      our_fee:
        Number(data.fee) +
        Number(apiGatewayConfig.paymentProcessing.withdrawalCharge),
    };
  }

  async getInAppBankList() {
    const banks = await Bank.find();
    return banks;
  }

  async creditUserAccount(data: {
    user: User;
    from?: User;
    amount: number;
    purpose: string;
    response: any;
    title: string;
    category: TRANSACTION_CATEGORIES;
  }) {
    const userToCredit: Account = await this.getAccount({
      user: data.user,
    });

    if (!userToCredit) throw new Error("Account is not ready for transaction");

    const amountToCredit = data.amount;
    const generateReferrence = HelperClass.generateRandomChar(19);
    const updatedBalance =
      Number(userToCredit.availableBalance) + amountToCredit;

    await this.updateAvailableBalance(updatedBalance, {
      user: userToCredit.user,
    });

    const transactionDump = await this.createTransactionDump({
      data: data.response,
      user: data.user,
    });
    // Store transaction
    const transaction = await this.createTransactionLog({
      user: data.user,
      source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
      type: TRANSACTION_TYPES.CREDIT,
      amount: Number(amountToCredit),
      purpose: data.purpose,
      transactionDump: transactionDump.id,
      reference: generateReferrence,
      category: data.category,
      status: TRANSACTION_STATUS.SUCCESSFUL,
      balanceAfterTransaction: updatedBalance,
      meta: {
        payerName: data.from?.username ?? "",
        message: "Transaction Credit",
        reference: generateReferrence,
      },
    });
    return transaction;
  }

  async chargeUserAccount(
    actor: User,
    idempotentKey: string,
    amount: string,
    data: {
      purpose: string;
      message: string;
      category: string;
      source: TRANSACTION_SOURCES;
      itemId: string;
      txType: string;
    }
  ): Promise<TransactionLogInterface> {
    const accountInfo = await this.queryAccountInfo({
      user: actor._id as string,
    });
    if (!accountInfo)
      throw new Error(
        "You cannot perform this action until your account is fully setup"
      );
    if (accountInfo.locked === true)
      throw new Error("Oops!, your account is locked, please contact support");
    const proceed = await this.controlTransaction(idempotentKey);
    if (!proceed) throw new Error("Oops!, Duplicate transaction");
    const txRef = generateTxRef(16, "num");
    if (Number(amount) <= accountInfo.availableBalance) {
      const updatedBalance = Number(
        (accountInfo.availableBalance - Number(amount)).toFixed(2)
      );
      await this.updateAvailableBalance(updatedBalance, {
        user: accountInfo.user,
      });
      // Store transaction
      const transaction = await this.createTransactionLog({
        user: accountInfo.user as string,
        source: data.source,
        type: TRANSACTION_TYPES.DEBIT,
        amount: Number(Number(amount).toFixed(2)),
        purpose: data.purpose,
        reference: txRef,
        category: data.category,
        status: TRANSACTION_STATUS.SUCCESSFUL,
        balanceAfterTransaction: updatedBalance,
        meta: {
          currency: CURRENCIES.NGN,
          message: data.message,
          payerId: actor.id,
          payerName: `${actor.firstName} ${actor.lastName}`,
          reference: txRef,
          itemId: data.itemId,
          transactionType: data.txType,
        },
      });

      this.emailService.debitUserAccountEmail(
        actor.email,
        `${actor.firstName} ${actor.lastName}`,
        data.message
      );
      createNotification({
        body: data.message,
        user: accountInfo.user as string,
        title: "Debit Notification",
        type: NOTIFICATION_TYPE.TRANSACTION,
      });

      return transaction;
    } else {
      throw new Error(
        `Oops! you don't have enough funds ${amount} to perform this transaction`
      );
    }
  }
  
  // FIX_HERE
  async validateAccountNumber(data: { account: string; bank: string }) {
    const account = await this.kora.checkAccount({
      bank: data.bank,
      account: data.account,
    });
    if (account.error) throw new Error(account.message);
    else {
      const payload = {
        accountNumber: data.bank,
        accountName: account.data.account_name,
        accountBank: data.account,
        fee: 60,
      };
      return payload;
    }
  }

  async validateUsername(username: string) {
    const account = await this.queryAccountInfo({ username });
    if (!account) throw new Error("Oops!, invalid username");
    const user = await this.userService.getUserById(account.user as string);
    return user;
  }

  async initiateScheduledPayment(
    schedule: Partial<ScheduleInterface>,
    actorId: string
  ) {
    /**
     * 1. Pass the ACTIVE schedule that needs to be processed
     * 2. Check if the user has enough funds to process the transaction
     * 3. If yes, proceed to process the transaction
     * 4. If no, send an email to the user to top up their account
     * 5. Check if the beneficiaries account is valid and active then push money for each of the beneficiaries and create a transaction log
     * 6. Update the schedule with the next billing cycle
     */

    const actorAccountInfo = await this.queryAccountInfo({
      user: actorId,
    });
    const actor = await this.userService.getUserById(actorId);
    if (!actorAccountInfo)
      throw new Error(
        "You cannot perform this action until your account is fully setup"
      );

    const beneficiaries = (await this.userService.getAllUsers({
      _id: { $in: schedule.beneficiaries } as unknown as string[],
      deletedAt: null,
    })) as PaginationModel<User>;

    if (beneficiaries.data.length === 0)
      throw new Error("Oops!, no beneficiaries found");

    await Promise.all(
      beneficiaries.data.map(async (beneficiary) => {
        const beneficiaryAccountInfo = await this.queryAccountInfo({
          user: beneficiary.id,
        });

        const beneficiaryProfile = await this.userService.getUserById(
          beneficiary.id as string
        );

        if (!beneficiaryAccountInfo || beneficiaryAccountInfo === null) {
          this.emailService.paymentUnsuccessfulEmail(
            actor.email,
            `${actor.firstName} ${actor.lastName}`,
            [
              {
                name: `${beneficiaryProfile.firstName} ${beneficiaryProfile.lastName}`,
              },
            ]
          );
          return false;
        }

        await this.updateAvailableBalance(
          (beneficiaryAccountInfo.availableBalance ?? 0) + schedule.amount,
          {
            user: beneficiary.id,
          }
        );

        await this.updateReservedBalance(
          actorAccountInfo.reservedBalance - schedule.amount,
          {
            user: schedule.creator as string,
          }
        );

        /** create a transaction log for the person that received the payment */
        const txRef = generateTxRef(16, "num");
        await this.createTransactionLog({
          user: beneficiary.id,
          source: TRANSACTION_SOURCES.USER_TRANSFER,
          type: TRANSACTION_TYPES.CREDIT,
          amount: schedule.amount,
          purpose: `Scheduled payment from ${actor.firstName} ${actor.lastName}`,
          reference: txRef,
          category: TRANSACTION_CATEGORIES.SCHEDULE_PAYMENT,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          balanceAfterTransaction:
            (beneficiaryAccountInfo.availableBalance ?? 0) + schedule.amount,
          meta: {
            currency: CURRENCIES.NGN,
            message: `Scheduled payment from ${actor.firstName} ${actor.lastName}`,
            payerId: actor.id,
            payerName: `${actor.firstName} ${actor.lastName}`,
            reference: txRef,
            scheduleId: schedule.id,
            transactionType: `SCHEDULE_PAYMENT`,
          },
        });

        /** Create a transaction log for the actor that made the payment */
        const _txRef = generateTxRef(16, "num");
        await this.createTransactionLog({
          user: actor.id,
          source: TRANSACTION_SOURCES.RESERVED_BALANCE,
          type: TRANSACTION_TYPES.DEBIT,
          amount: schedule.amount,
          purpose: `Scheduled payment for ${beneficiary.lastName} ${beneficiary.firstName}`,
          reference: _txRef,
          category: TRANSACTION_CATEGORIES.SCHEDULE_PAYMENT,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          balanceAfterTransaction:
            actorAccountInfo.reservedBalance - schedule.amount,
          meta: {
            currency: CURRENCIES.NGN,
            message: `Scheduled payment for ${beneficiary.lastName} ${beneficiary.firstName}`,
            payerId: actor.id,
            payerName: `${actor.firstName} ${actor.lastName}`,
            reference: _txRef,
            scheduleId: schedule.id,
            transactionType: `SCHEDULE_PAYMENT`,
          },
        });

        const sendDebitMessage = `You paid ${schedule.amount} NGN to ${beneficiaryProfile.lastName} ${beneficiaryProfile.firstName} via the scheduled payment feature`;
        this.emailService.debitUserAccountEmail(
          actor.email,
          `${actor.lastName} ${actor.firstName}`,
          sendDebitMessage
        );

        const message = `${schedule.amount} NGN was credited to your wallet by ${actor.lastName} ${actor.firstName}`;
        this.emailService.sendUserAccountCreditedEmail(
          beneficiaryProfile.email,
          `${beneficiaryProfile.lastName} ${beneficiaryProfile.firstName} `,
          message
        );
        return true;
      })
    );
    return true;
  }

  async updateUserKycInfo(filter: Partial<UserKyc>, kycInfo: Partial<UserKyc>) {
    const kyc = await this.getUserKycInfo(filter);
    if (!kyc) {
      const newKyc = await UserKyc.create(kycInfo);
      return newKyc;
    }
    Object.assign(kyc, kycInfo);
    await kyc.save();
    return kyc;
  }
  async getUserKycInfo(filter: Partial<UserKyc>) {
    const kyc = await UserKyc.findOne(filter);
    return kyc;
  }

  // ** Utilities

  async buyAirtime(body: { phone: string; amount: string; serviceID: string }) {
    const airtime = await this.vtpass.buyAirtime(body);
    if (airtime.error) throw new Error(airtime.message);
    return airtime;
  }

  async validateCustomerReference(body: ValidateCustomerReference) {
    const validateCustomer = await this.vtpass.validateCustomerReference(body);
    if (validateCustomer.content.error)
      throw new Error(validateCustomer.content.error);
    return validateCustomer.content;
  }

  async getVariations(body: ValidateCustomerReference) {
    const validateCustomer = await this.vtpass.getVariations(body);
    if (validateCustomer.code == "000")
      throw new Error(validateCustomer.content.response_description);
    return validateCustomer.content.varations;
  }

  async purchaseUtilities(body: purchaseUtilitiesType) {
    const utility = await this.vtpass.purchaseUtility(body);
    if (
      utility.content.transactions.status === "failed" ||
      utility.code != "000"
    )
      throw new Error(utility.response_description);
    return {
      ...utility,
      reference: utility?.requestId,
      message:
        utility?.purchased_code ??
        utility?.mainToken ??
        utility?.response_description ??
        "Successful Transaction",
    };
  }

  async getUtilitiesProviders() {
    const providers = await this.vtpass.getUtilitiesProviders();
    return providers;
  }

  // **

  calculateReferred(charge: number) {
    return charge * 0.3;
  }
}
