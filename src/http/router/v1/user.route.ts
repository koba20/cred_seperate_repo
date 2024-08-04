import { Router } from "express";
import { userController } from "../../controllers/controllers.module";
import { isUserAuthenticated } from "../../middlewares/auth.middleware";
import validate from "../../middlewares/validate";
import {
  updateUserAccount,
  changePasswordValidator,
  joinOrganizationValidation,
  validateKyc,
} from "../../../validators/User.validation";
import upload from "../../../utils/multer.config";

const route = Router();




route.get("/send", isUserAuthenticated, (req, res, next) => {
  userController.sendMessage(req, res, next);
});



route
  .route("/notification")
  .get(isUserAuthenticated, (req, res, next) => {
    userController.getNotifications(req, res, next);
  })
  .patch(isUserAuthenticated, (req, res, next) => {
    userController.markNotificationAsRead(req, res, next);
  });

route
  .route("/me")
  .get(isUserAuthenticated, (req, res, next) => {
    userController.getMyProfile(req, res, next);
  })
  .patch(isUserAuthenticated, validate(updateUserAccount), (req, res, next) => {
    userController.updateMyProfile(req, res, next);
  });

route.patch(
  "/me/password",
  isUserAuthenticated,
  validate(changePasswordValidator),
  (req, res, next) => {
    userController.changePassword(req, res, next);
  }
);

route.get("/referrals", isUserAuthenticated, (req, res, next) => {
  userController.getUserReferredUsers(req, res, next);
});

route.post(
  "/add-kyc",
  isUserAuthenticated,
  validate(validateKyc),
  (req, res, next) => {
    userController.addKYC(req, res, next);
  }
);

route.put("/resend-verification", isUserAuthenticated, (req, res, next) => {
  userController.renewRequest(req, res, next);
});

route.delete("/cancel-request", isUserAuthenticated, (req, res, next) => {
  userController.cancelRequest(req, res, next);
});

route.post(
  "/join-organization",
  isUserAuthenticated,
  validate(joinOrganizationValidation),
  (req, res, next) => {
    userController.joinOrganization(req, res, next);
  }
);

route
  .route("/upload-avatar")
  .patch(isUserAuthenticated, upload.single("file"), (req, res, next) => {
    userController.uploadAvatar(req, res, next);
  });

route.get("/search", isUserAuthenticated, (req, res, next) => {
  userController.searchUsers(req, res, next);
});

route.route("/token").post(isUserAuthenticated, (req, res, next) => {
  userController.submitToken(req, res, next);
});

route.route("/device").post(isUserAuthenticated, (req, res, next) => {
  userController.saveUserDeviceInfo(req, res, next);
});

route
  .route("/username/:username")
  .get(isUserAuthenticated, (req, res, next) => {
    userController.getUserProfile(req, res, next);
  });

route.route("/:userId").get(isUserAuthenticated, (req, res, next) => {
  userController.getUserProfile(req, res, next);
});

export default route;
