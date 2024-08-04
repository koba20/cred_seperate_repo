import Tenor from "../database/models/loan/tenor.model";
import Loan from "../database/models/loan/loan.model";
import {
  LOAN_STATUS,
  TENOR_STATUS,
  TRANSACTION_CATEGORIES,
  TRANSACTION_SOURCES,
} from "../../config/constants";

import FlutterwaveClient from "./flutterwave/Flutterwave.client";
import KoraClient from "./kora/Kora.client";
import EmailService from "./Email.service";
import VtpassClient from "./vtpass/Vtpass.client";
import EncryptionService from "./Encryption.service";
import UserService from "./User.service";
import apiGatewayConfig from "../../config/config";

import HelperClass from "../utils/helper";
import { User } from "../..";
import PaymentService from "./payment.service";

export default class LoansService {
  paymentService = new PaymentService(
    new FlutterwaveClient({
      pkey: apiGatewayConfig.paymentData.fpkey,
      skey: apiGatewayConfig.paymentData.fskey,
      enkey: apiGatewayConfig.paymentData.fekey,
      test: false,
    }),
    new KoraClient({
      pkey: apiGatewayConfig.paymentData.korapkey,
      skey: apiGatewayConfig.paymentData.koraskey,
      enkey: apiGatewayConfig.paymentData.koraekey,
      test: false,
    }),
    new EmailService(),
    new UserService(),
    new VtpassClient({ skey: apiGatewayConfig.paymentData.vtpasskey }),
    new EncryptionService()
  );

  async createLoan(loanBody: Partial<Loan>): Promise<Loan> {
    const loan = await Loan.create(loanBody);
    return loan;
  }
  async createTenor(tenorBody: Partial<Tenor>): Promise<Tenor> {
    const tenor = await Tenor.create(tenorBody);
    return tenor;
  }
  async updateTenor(id: string, tenorBody: Partial<Tenor>): Promise<Tenor> {
    const tenor = await Tenor.findByIdAndUpdate(id, tenorBody);
    return tenor;
  }

  async getLoanDetails(filter: any): Promise<Loan> {
    const data = await Loan.findOne({ ...filter });
    return data;
  }
  async getLoanById(id: any): Promise<Loan> {
    const data = await Loan.findById(id).populate("tenors");
    return data;
  }

  async checkLoanProfile(user: any): Promise<{
    loans: [string];
    hasLoan: boolean;
    dept: number;
    fullRepayments: number;
  }> {
    const pipeline = [
      // Match loans associated with the user
      { $match: { user: user } },
      // Project necessary fields for analysis
      {
        $project: {
          _id: 1,
          status: "$status.status",
          outstanding: 1,
        },
      },
      // Determine if the user has an active loan

      {
        $group: {
          _id: null as null,
          activeLoanIds: {
            $push: {
              $cond: [{ $eq: ["$status", LOAN_STATUS.APPROVED] }, "$_id", null],
            },
          },
          amountLeft: {
            $sum: {
              $cond: [
                { $eq: ["$status", LOAN_STATUS.APPROVED] },
                "$outstanding",
                0,
              ],
            },
          },
          hasActiveLoan: {
            $sum: { $cond: [{ $eq: ["$status", LOAN_STATUS.APPROVED] }, 1, 0] },
          },
          fullRepayments: {
            $sum: {
              $cond: [{ $eq: ["$status", LOAN_STATUS.COMPLETED] }, 1, 0],
            },
          },
        },
      },
      // Project final result with default values if no active loan
      {
        $project: {
          _id: 0,
          loans: { $ifNull: ["$activeLoanIds", null] },
          hasLoan: {
            $gt: ["$hasActiveLoan", 0],
          },
          dept: { $ifNull: ["$amountLeft", 0] },
          fullRepayments: "$fullRepayments",
        },
      },
    ];
    const result = await Loan.aggregate(pipeline);
    return result[0] == undefined
      ? {
          loans: [],
          hasLoan: false,
          dept: 0,
          fullRepayments: false,
        }
      : result[0];
  }

  async loanPaymentCheck() {}

  async getTenorDetails(filter: any): Promise<Tenor> {
    const data = await Tenor.findOne({ ...filter }).sort({ index: 1 });
    return data;
  }
  async getTenorsByDetails(filter: any): Promise<Tenor[]> {
    const data = await Tenor.find(filter).sort({ index: 1 });
    return data;
  }

  async getActiveLoansForUser(user: string) {
    const data = await Loan.find({
      user,
      "status.status": LOAN_STATUS.APPROVED,
    }).populate("tenors");
    return data;
  }
  async getLoansForUser(user: string) {
    const data = await Loan.find({ user });
    return data;
  }

  async execLoanRepayment(config: {
    amount: number;
    loan: string;
    idempotentKey: string;
    users: User;
  }): Promise<any> {
    let fullyPaid = false;
    let amount = Number(config.amount);
    let { loan, idempotentKey } = config;
    let _loan = await this.getLoanById(loan);
    let amountDeposited = amount;

    if (!_loan) throw new Error("Loan not found");
    if (_loan.status.status === LOAN_STATUS.COMPLETED)
      throw new Error("loan is fully paid.");
    if (_loan.status.status !== LOAN_STATUS.APPROVED)
      throw new Error("loan is not active");
    // check if its my loan
    if (!(_loan.user == config.users.id))
      throw new Error("You are not allowed to repay this loan");
    if (_loan.outstanding - Number(amount) < 0)
      throw new Error(
        `Amount is greater than dept ${_loan.outstanding} is what you should pay`
      );
    if (_loan.outstanding - Number(amount) == 0) fullyPaid = true;

    const _tenors = await this.getTenorsByDetails({
      user: config.users.id,
      loan: _loan._id,
      $or: [
        { "status.status": TENOR_STATUS.PENDING },
        { "status.status": TENOR_STATUS.IN_PROGRESS },
        { "status.status": TENOR_STATUS.OVER_DUE },
      ],
    });

    const account = await this.paymentService.getAccount({
      user: config.users.id,
    });
    const chargeValue = HelperClass.checkChargableForTenors(
      _tenors,
      amountDeposited
    );

    console.log(account);

    if (!account) throw new Error("Account is not available");
    if (account.lock.isLocked) throw new Error("Acount is locked");
    if (account.availableBalance < chargeValue)
      throw new Error("Insufficient funds");

    // Attemp Charge
    await this.paymentService.chargeUserAccount(
      config.users,
      idempotentKey,
      `${chargeValue}`,
      {
        purpose: `Loan repayment for ${_loan.status.reason}`,
        message: "Loan repayment",
        category: TRANSACTION_CATEGORIES.LOAN_REPAYMENT,
        source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
        itemId: loan,
        txType: "LOAN_REPAYMENT",
      }
    );

    for (let tenor of _tenors) {
      const remainingAmount = tenor.amount - tenor.depositedAmount;
      if (amount >= remainingAmount) {
        amount = amount - remainingAmount;
        await this.updateTenor(tenor._id, {
          depositedAmount: tenor.depositedAmount + remainingAmount,
          completedAt: new Date(),
          balanceAmount: 0,
          status: {
            status: TENOR_STATUS.COMPLETED,
            reason: "Loan fully paid",
          },
        });
      } else {
        await this.updateTenor(tenor._id, {
          depositedAmount: tenor.depositedAmount + amount,
          balanceAmount: tenor.amount - amount,
          status: {
            status: TENOR_STATUS.IN_PROGRESS,
            reason: "Loan partially paid",
          },
        });
        amount = 0;
        break;
      }
    }

    const result = await this.updateLoanById(_loan._id, {
      outstanding: _loan.outstanding - amountDeposited,
      status: {
        status: fullyPaid ? LOAN_STATUS.COMPLETED : LOAN_STATUS.APPROVED,
        reason: `Received ${amount}`,
      },
    });

    return result;
  }

  async getTenorForLoan(loan: string) {
    const data = await Tenor.find({ loan }).sort({ index: 1 });
    return data;
  }

  async getAllLoans(
    filter: Partial<Loan>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePagination = false
  ) {
    const data = ignorePagination
      ? await Loan.find(filter)
      : await Loan.paginate(filter, options);
    return data;
  }

  // Cancel loan by loan id
  async cancelLoan(loan: string) {
    const data = await Loan.findByIdAndUpdate(loan, {
      status: LOAN_STATUS.CANCELLED,
    });
    return data;
  }

  // Get All outstanding Loan request yet to be  approved for a user
  async getPendingLoans(user: string) {
    const data = await Loan.find({ user, status: LOAN_STATUS.PENDING });
    return data;
  }

  async updateLoanById(loan: string, updateBody: Partial<Loan>) {
    const data = await Loan.findByIdAndUpdate(loan, updateBody, {
      new: true,
    });
    return data;
  }
}
