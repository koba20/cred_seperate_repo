import { NextFunction, Response } from "express";
import LoansService from "../../../services/Loan.service";
import OraganizationService from "../../../services/Organization.service";
import PaymentService from "../../../services/payment.service";
import UserService from "../../../services/User.service";
import { RequestType } from "../../middlewares/auth.middleware";
import {
  ACCOUNT_STATUS,
  ELIGIBILITY_STATUS,
  LOAN_STATUS,
  TRANSACTION_CATEGORIES,
  WORK_STATUS,
} from "../../../../config/constants";
import AppException from "../../../exceptions/AppException";
import httpStatus from "http-status";
import EmailService from "../../../services/Email.service";
import WorkService from "../../../services/Work.service";
import { Eligibility, Loan, Work } from "../../../..";
import EligibilityService from "../../../services/Eligibility.service";
import pick from "../../../utils/pick";
import { ObjT } from "../../../services/dojah/util";
import moment from "moment";

export default class LoanAdminController {
  constructor(
    private readonly loanService: LoansService,
    private readonly userService: UserService,
    private readonly organizationService: OraganizationService,
    private readonly emailService: EmailService,
    private readonly paymentService: PaymentService,
    private readonly workService: WorkService,
    private readonly eligibilityService: EligibilityService
  ) {}

  async respondToLoan(req: RequestType, res: Response, next: NextFunction) {
    console.log(this.organizationService);
    try {
      const loan: Loan = await this.loanService.getLoanById(req.body.loan);
      if (!loan) throw new Error("Invalid loan ID");

      delete req.body.loan;
      const work: Work = await this.workService.getWorkByUser(loan.user);
      const user = await this.userService.getUserById(loan.user as string);
      if (user.accountStatus.status != ACCOUNT_STATUS.ACTIVATED)
        throw new Error("Account verification Pending");
      if (!work) throw new Error("User work not found");

      const eligibility: Eligibility =
        await this.eligibilityService.getEligibilityByDetails({
          user: loan.user,
        });

      if (!eligibility) throw new Error("You are not eligible for laon yet");
      if (eligibility.status.status != ELIGIBILITY_STATUS.ELIGIBLE)
        throw new Error(
          `User is not eligible for laon at this time current status ${eligibility.status.status}`
        );

      if (work.status.status != WORK_STATUS.ACTIVE)
        throw Error("Work profile is not activated");

      if (req.body.response == LOAN_STATUS.APPROVED) {
        await this.loanService.updateLoanById(loan._id, {
          duration: {
            startDate: moment().utc().startOf("day").toDate(),
            endDate: moment()
              .utc()
              .startOf("day")
              .add(eligibility.months, "month")
              .toDate(),
          },
          status: {
            status: LOAN_STATUS.APPROVED,
            reason: req.body.reason,
          },
        });

        if (user.email) {
          await this.emailService.notifyStationUsersOfNotification(
            user.email,
            `${user.firstName}`,
            `Your loan request of ${loan.amount} is has been approved`
          );
        }

    

        this.paymentService.creditUserAccount({
          user: user,
          amount: loan.amount,
          purpose: "CredX Loan",
          response: loan,
          title: `Your loan request of ${loan.amount}`,
          category: TRANSACTION_CATEGORIES.LOAN,
        },);


      } else if (req.body.response == LOAN_STATUS.DECLINED) {
        await this.loanService.updateLoanById(loan._id, {
          status: {
            status: LOAN_STATUS.DECLINED,
            reason: req.body.reason,
          },
        });

        if (user.email) {
          await this.emailService.notifyStationUsersOfNotification(
            user.email,
            `${user.firstName}`,
            `Your loan request of ${loan.amount} is has been rejected`
          );
        }

        await this.eligibilityService.updateEligibilityById(eligibility._id, {
          status: {
            status: ELIGIBILITY_STATUS.ELIGIBLE,
            reason: `You have an outstanding loan`,
          },
        });
      } else {
        throw new Error("Invalid response");
      }

      res.status(httpStatus.CREATED).json({
        status: "success",
        message: `You response is saved successfully. Request ${req.body.response}`,
        data: loan,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getAllLoans(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = pick(req.query, ["status", "role"]) as ObjT;
      const options = pick(req.query, ["orderBy", "page", "limit", "populate"]);

      if (filter.status) {
        Object.assign(filter, { "status.status": filter.status });
        delete filter.status;
      }

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

  async getALoan(req: RequestType, res: Response, next: NextFunction) {
    try {
      const id = req.query.id;
      if (!id) throw new Error("Please provid a valid loan id");
      const loan = await this.loanService.getLoanById(id);
      if (!loan) throw new Error("Loan not found");

      res.status(httpStatus.OK).json({
        status: "success",
        data: loan,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }
}
