import { Router } from "express";
import {
  isUserAuthenticated,
  isAdminAuthenticated,
} from "../../middlewares/auth.middleware";
import {
  loanController,
  loanAdminController,
} from "../../controllers/controllers.module";

import validate from "../../middlewares/validate";
import {
  cancelLoanValidator,
  loanRepaymentValidator,
  requestLoanValidator,
  resonseValidator,
} from "../../../validators/Loan.validator";

const router = Router();

router
  .route("/request")
  .post(
    isUserAuthenticated,
    validate(requestLoanValidator),
    (req, res, next) => {
      loanController.requstLoan(req, res, next);
    }
  )
  .get(isUserAuthenticated, (req, res, next) => {
    loanController.getHistory(req, res, next);
  });

router
  .route("/cancel-request")
  .delete(
    isUserAuthenticated,
    validate(cancelLoanValidator),
    (req, res, next) => {
      loanController.cancelLoan(req, res, next);
    }
  );

  
router
  .route("/repay")
  .post(
    isUserAuthenticated,
    validate(loanRepaymentValidator),
    (req, res, next) => {
      loanController.repayLoan(req, res, next);
    }
  );

router.route("/eligibility").get(isUserAuthenticated, (req, res, next) => {
  loanController.getEligibity(req, res, next);
});

router.route("/admin/all").get(isAdminAuthenticated, (req, res, next) => {
  loanAdminController.getAllLoans(req, res, next);
});

router.route("/admin/single").get(isAdminAuthenticated, (req, res, next) => {
  loanAdminController.getALoan(req, res, next);
});

router
  .route("/admin/respond")
  .patch(isAdminAuthenticated, validate(resonseValidator), (req, res, next) => {
    loanAdminController.respondToLoan(req, res, next);
  });

export default router;
