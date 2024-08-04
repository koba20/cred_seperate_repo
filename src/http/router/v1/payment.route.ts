import Route from "express";
import { isUserAuthenticated } from "../../middlewares/auth.middleware";
import { paymentController } from "../../controllers/controllers.module";
import validate from "../../middlewares/validate";
import {
  inAppTransfer,
  withdrawal,
  userKyc,
  validateAccount,
  getVariations,
  buyAirtime,
  purchaseUtilities,
  validateCustomerReference,
  validateTransactionPin,
  createTransactionPin,
  addCard,
  addCardVerify,
} from "../../../validators/Payment.validation";

const router = Route();

router.route("/funding").post((req, res) => {
  paymentController.creditAccount(req, res);
});

router
  .route("/add-card")
  .post(isUserAuthenticated, validate(addCard), (req, res, next) => {
    paymentController.addCard(req, res, next);
  })
  .patch(isUserAuthenticated, validate(addCardVerify), (req, res, next) => {
    paymentController.verifyCard(req, res, next);
  });
  
router.route("/verify/:hash").get((req, res, next) => {
  paymentController.addCardCallback(req, res, next);
});

router.route("/account-info").get(isUserAuthenticated, (req, res, next) => {
  paymentController.getAccountInfo(req, res, next);
});

router
  .route("/withdraw")
  .post(isUserAuthenticated, validate(withdrawal), (req, res, next) => {
    paymentController.withdrawMoney(req, res, next);
  });

router
  .route("/kyc")
  .post(isUserAuthenticated, validate(userKyc), (req, res, next) => {
    paymentController.updateUserKyc(req, res, next);
  });

router.route("/accept-payment").post((req, res, next) => {
  paymentController.acceptPayment(req, res, next);
});
router.route("/charge-user").post(isUserAuthenticated, (req, res, next) => {
  paymentController.chargeUserWallet(req, res, next);
});

router
  .route("/transfer")
  .post(isUserAuthenticated, validate(inAppTransfer), (req, res, next) => {
    paymentController.inAppTransfer(req, res, next);
  });

router.route("/bank-list").get(isUserAuthenticated, (req, res, next) => {
  paymentController.getBankList(req, res, next);
});

router
  .route("/validate-account")
  .post(validate(validateAccount), (req, res, next) => {
    paymentController.validateAccount(req, res, next);
  });

router.route("/validate-wallet-code").post((req, res, next) => {
  paymentController.validateUsername(req, res, next);
});

router.route("/transactions").get(isUserAuthenticated, (req, res, next) => {
  paymentController.getTransactions(req, res, next);
});

router.route("/transaction/:id").get(isUserAuthenticated, (req, res, next) => {
  paymentController.getTransaction(req, res, next);
});

router
  .route("/transaction-pin")
  .post(
    isUserAuthenticated,
    validate(validateTransactionPin),
    (req, res, next) => {
      paymentController.verifyPin(req, res, next);
    }
  )
  .patch(
    isUserAuthenticated,
    validate(createTransactionPin),
    (req, res, next) => {
      paymentController.saveTransactionPin(req, res, next);
    }
  );

router
  .route("/reset-txpin")
  .patch(isUserAuthenticated, (req, res, next) => {
    paymentController.resetPin(req, res, next);
  })
  .post(isUserAuthenticated, (req, res, next) => {
    paymentController.sendPinResetEmail(req, res, next);
  });

router.route("/validate-wallet-code").post((req, res, next) => {
  paymentController.validateUsername(req, res, next);
});

router.route("/mobile-operators").get(isUserAuthenticated, (req, res, next) => {
  paymentController.getMobileOperators(req, res, next);
});

router
  .route("/buy-airtime")
  .post(isUserAuthenticated, validate(buyAirtime), (req, res, next) => {
    paymentController.buyAirtime(req, res, next);
  });

router
  .route("/get-variations")
  .post(isUserAuthenticated, validate(getVariations), (req, res, next) => {
    paymentController.getVariations(req, res, next);
  });

router
  .route("/utilities")
  .post(isUserAuthenticated, validate(purchaseUtilities), (req, res, next) => {
    paymentController.purchaseUtilities(req, res, next);
  });

router
  .route("/validate-customer")
  .post(
    isUserAuthenticated,
    validate(validateCustomerReference),
    (req, res, next) => {
      paymentController.validateCustomerDetails(req, res, next);
    }
  );

router.route("/cable-utilities").get(isUserAuthenticated, (req, res, next) => {
  paymentController.cableUtilities(req, res, next);
});
router
  .route("/electricity-utilities")
  .get(isUserAuthenticated, (req, res, next) => {
    paymentController.electricityUtilities(req, res, next);
  });

export default router;
