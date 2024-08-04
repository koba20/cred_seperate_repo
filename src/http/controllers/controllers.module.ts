/**
 * Use this module file to create instances of all controllers and simplify imports in to your routers
 */

import UserController from "./users.controller";
import PaymentController from "./payment.controller";
import PaymentService from "../../services/payment.service";
import UserService from "../../services/User.service";
import EmailService from "../../services/Email.service";
import EncryptionService from "../../services/Encryption.service";
import ReportController from "./report.controller";
import ReportService from "../../services/Report.service";
import ScheduleController from "./schedule.controller";
import ScheduleService from "../../services/Schedule.service";
import AdminController from "./admin.controller";
import AdminService from "../../services/Admin.service";
import AuthService from "../../services/Auth.service";
import TokenService from "../../services/Token.service";
import NotificationController from "./notification.controller";
import apiGatewayConfig from "../../../config/config";
import OrganizationController from "./organization/organization.controller";
import OraganizationService from "../../services/Organization.service";
import VtpassClient from "../../services/vtpass/Vtpass.client";
import LoanController from "./loan/loan.controller";
import LoansService from "../../services/Loan.service";
import WorkService from "../../services/Work.service";
import EligibilityService from "../../services/Eligibility.service";
import LoanAdminController from "./loan/loan.admin.controller";
import KoraClient from "../../services/kora/Kora.client";
import FlutterwaveClient from "../../services/flutterwave/Flutterwave.client";

// *

//

export const userController = new UserController(
  new UserService(),
  new PaymentService(
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
  ),
  new EncryptionService(),
  new WorkService(),
  new OraganizationService()
);

export const paymentController = new PaymentController(
  new PaymentService(
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
  ),
  new UserService(),
  new EmailService(),
  new EncryptionService(),
  new AdminService(),
  new LoansService()
);

export const reportController = new ReportController(new ReportService());

export const scheduleController = new ScheduleController(
  new ScheduleService(),
  new PaymentService(
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
  ),
  new EmailService()
);

export const adminController = new AdminController(
  new AdminService(),
  new AuthService(
    new EncryptionService(),
    new TokenService(),
    new EmailService()
  ),
  new UserService(),
  new EmailService(),
  new PaymentService(
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
  ),
  new EncryptionService()
);

export const notificationController = new NotificationController(
  new EmailService(),
  new UserService()
);

export const loanController = new LoanController(
  new LoansService(),
  new OraganizationService(),
  new EmailService(),
  new PaymentService(
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
  ),
  new WorkService(),
  new EligibilityService()
);

export const loanAdminController = new LoanAdminController(
  new LoansService(),
  new UserService(),
  new OraganizationService(),
  new EmailService(),
  new PaymentService(
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
  ),
  new WorkService(),
  new EligibilityService()
);
export const organizationController = new OrganizationController(
  new UserService(),
  new EmailService(),
  new OraganizationService(),
  new WorkService(),
  new EligibilityService()
);
