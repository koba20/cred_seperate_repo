import { NextFunction, Response } from "express";
import LoansService from "../../../services/Loan.service";
import OraganizationService from "../../../services/Organization.service";
import PaymentService from "../../../services/payment.service";
import { RequestType } from "../../middlewares/auth.middleware";
import {
  ELIGIBILITY_STATUS,
  LOAN_STATUS,
  TENOR_STATUS,
  TRANSACTION_CATEGORIES,
  WORK_STATUS,
} from "../../../../config/constants";
import AppException from "../../../exceptions/AppException";
import httpStatus from "http-status";
import EmailService from "../../../services/Email.service";
import WorkService from "../../../services/Work.service";
import { Eligibility, Work } from "../../../..";
import EligibilityService from "../../../services/Eligibility.service";
import HelperClass from "../../../utils/helper";
import pick from "../../../utils/pick";

export default class LoanController {
  constructor(
    private readonly loanService: LoansService,
    private readonly organizationService: OraganizationService,
    private readonly emailService: EmailService,
    private readonly paymentService: PaymentService,
    private readonly workService: WorkService,
    private readonly eligibilityService: EligibilityService
  ) {}

  // Allow user cancel existing loan request
  async cancelLoan(req: RequestType, res: Response, next: NextFunction) {
    try {
      const { loan } = req.body;
      const _loan = await this.loanService.getLoanById(loan);
      if (!_loan) throw new Error("Loan not found");
      if (_loan.status.status !== LOAN_STATUS.PENDING)
        throw new Error("loan is not pending");

      // check if its my loan
      if (!((_loan.user as string) == (req.user.id as string)))
        throw new Error("You are not allowed to cancel this loan");

      const data = await this.loanService.cancelLoan(loan);

      // update Eligibility after loan is cancellle
      const eligibility = await this.eligibilityService.getUserEligibility(
        req.user
      );
      if (eligibility) {
      } // TODO: return to Payment if progress if  i hava loand or inacive if i dont

      res.status(httpStatus.OK).json({
        status: "success",
        message: `loan '${_loan.status?.reason || ""}' has been cancelled`,
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  // Repay loan

  async repayLoan(req: RequestType, res: Response, next: NextFunction) {
    try {
      console.log("hello");

      const data = await this.loanService.execLoanRepayment({
        ...req.body,
        users: req.user,
      });

      res.status(httpStatus.OK).json({
        status: "success",
        message: `Payment successfull`,
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async requstLoan(req: RequestType, res: Response, next: NextFunction) {
    try {
      const work: Work = await this.workService.getWorkByUser(req.user);

      const eligibility: Eligibility =
        await this.eligibilityService.getUserEligibility(req.user);

      if (!eligibility) throw new Error("You are not eligible for laon yet");
      const loanTerm = req.body.duration;
      const loanAmount = req.body.amount;
      const loanReason = req.body.reason;

      const checkLoan = await this.loanService.checkLoanProfile(
        req.user._id as string
      );

      if (eligibility.status.status != ELIGIBILITY_STATUS.ELIGIBLE)
        throw new Error("You are current not eligible for a loan");

      if (work.status.status != WORK_STATUS.ACTIVE)
        throw Error("Work profile is not activated");

      if (checkLoan.loans.length > 0) {
        if (checkLoan.dept >= eligibility.amount) {
          throw new Error(
            `You are not eligible. Tranch Exhusted. Please pay off some loans and try again`
          );
        }
      }

      if (loanAmount > eligibility.amount)
        throw new Error(
          `You are not eligible a loan amount ${eligibility.amount} Max eleigibility ${eligibility.amount}`
        );

      if (loanTerm > eligibility.months)
        throw new Error(`Max loan term is ${eligibility.months} months`);

      const organization = await this.organizationService.getOrganizationById(
        work.organization as string
      );

      if (!organization) throw new Error("Organization not found");

      delete req.body.duration;
      delete req.body.reason;

      const totalInterest = organization.loanInfo.interest; // 5%
      const totalInterestAmount = HelperClass.calculateAmountPercentate({
        amount: loanAmount,
        percentage: totalInterest,
      });

      const totalWithInterest = Number(loanAmount) + totalInterestAmount;

      const loan = await this.loanService.createLoan({
        work: work._id,
        user: req.user.id,
        organization: organization._id,
        amount: req.body.amount,
        interest: totalInterest,
        outstanding: totalWithInterest,
        interestAmount: totalInterestAmount,
        totalAmount: totalWithInterest,
        status: {
          status: LOAN_STATUS.PENDING,
          reason: loanReason,
        },
      });

      console.log("Done")

      const tenors: string[] = [];
      const tenorsDate = HelperClass.generateNextDates(
        organization.repaymentInfo.payday,
        loanTerm
      );

      console.log(tenorsDate);

      await Promise.all(
        tenorsDate.map(async (_date: Date, index) => {
          const tenor = await this.loanService.createTenor({
            loan: loan._id,
            user: req.user.id,
            amount: totalWithInterest / loanTerm,
            depositedAmount: 0,
            dueAt: _date,
            index: index,
            completedAt: null,
            status: {
              status: TENOR_STATUS.PENDING,
              reason: "Initial Deposit",
            },
          });

          tenors.push(tenor._id);
        })
      );

       this.emailService.notifyStationUsersOfNotification(
        req.user.email,
        `${req.user.firstName}`,
        `Your loan request of ${req.body.amount} is successfull`
      );

      this.loanService.updateLoanById(loan._id, {
        tenors: tenors,
        status: {
          status: LOAN_STATUS.APPROVED,
          reason: loanReason,
        },
      });

      this.paymentService.creditUserAccount({
        user: req.user,
        amount: loan.amount,
        purpose: "CredX Loan",
        response: loan,
        title: `Your loan request of ${loan.amount}`,
        category: TRANSACTION_CATEGORIES.LOAN,
      });

      this.eligibilityService.updateEligibilityById(req.user._id, {
        status: {
          status: ELIGIBILITY_STATUS.ELIGIBLE,
          reason: `You have made a request to ${organization.name} for a sum of ${req.body.amount}}`,
        },
      });

      res.status(httpStatus.CREATED).json({
        status: "success",
        message: "You requested was placed successfully",
        data: loan,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getHistory(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = pick(req.query, ["status", "role"]);
      const options = pick(req.query, ["orderBy", "page", "limit", "populate"]);

      Object.assign(filter, {
        user: req.user.id,
      });

      const data = await this.loanService.getAllLoans(filter, options);
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

  async getEligibity(req: RequestType, res: Response, next: NextFunction) {
    try {
      if (req.user.requestToJoin) {
        return res.status(httpStatus.OK).json({
          status: "error",
          message: "You have a pending verification request",
          data: {
            eligible: ELIGIBILITY_STATUS.PENDING,
          },
        });
      }

      const eligibleFor = await this.eligibilityService.getUserEligibility(
        req.user
      );

      const loans = await this.loanService.getActiveLoansForUser(req.user.id);

      if (!eligibleFor)
        throw new Error(
          "You are not eligible for a loan please connect to an organization"
        );

      res.status(httpStatus.OK).json({
        status: "success",
        data: eligibleFor,
        loans,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }
}
