import {
  AdminLoginValidator,
  LoginValidator,
  RegenerateAccessToken,
  RegisterOtpValidator,
  ResetPasswordValidator,
  createValidator,
  createAdminValidator,
  forgotPasswordValidator,
  verifyUserEmailValidator,
} from "../../../validators/Auth.validation";
import { NextFunction, Request, Response, Router } from "express";
import {
  adminAuth,
  userAuth,
} from "../../controllers/auth/authentication.module";

import { resendOtpValidator } from "../../../validators/Auth.validation";
import validate from "../../middlewares/validate";

const route = Router();

route.get("/check-user", (req, res, next) => {
  userAuth.checkUser(req, res, next);
});

route.post("/user/register", validate(createValidator), (req, res, next) => {
  userAuth.create(req, res, next);
});

route.post(
  "/user/verify-registration",
  validate(RegisterOtpValidator),
  (req, res, next) => {
    userAuth.verifyRegister(req, res, next);
  }
);

// send a token when i want to reset my token
route.post(
  "/user/forgot-password",
  validate(forgotPasswordValidator),
  (req: Request, res: Response, next: NextFunction) => {
    userAuth.passwordReset(req, res, next);
  }
);

route.post("/user/login", validate(LoginValidator), (req, res, next) => {
  userAuth.login(req, res, next);
});

route.post(
  "/user/regenerate-access-token",
  validate(RegenerateAccessToken),
  (req, res, next) => {
    userAuth.regenerateAccessToken(req, res, next);
  }
);

route.post(
  "/user/reset-password",
  validate(ResetPasswordValidator),
  (req: Request, res: Response, next: NextFunction) => {
    userAuth.resetPassword(req, res, next);
  }
);

route.post(
  "/admin/create",
  validate(createAdminValidator),
  (req, res, next) => {
    adminAuth.create(req, res, next);
  }
);

route.post(
  "/admin/verify-email",
  validate(verifyUserEmailValidator),
  (req, res, next) => {
    adminAuth.verifyEmail(req, res, next);
  }
);

route.post("/admin/login", validate(AdminLoginValidator), (req, res, next) => {
  adminAuth.login(req, res, next);
});

route.post(
  "/admin/regenerate-access-token",
  validate(RegenerateAccessToken),
  (req, res, next) => {
    adminAuth.regenerateAccessToken(req, res, next);
  }
);

route.post(
  "/admin/resend-otp",
  validate(resendOtpValidator),
  (req, res, next) => {
    adminAuth.resendOtp(req, res, next);
  }
);

route.post(
  "/admin/forgot-password",
  validate(forgotPasswordValidator),
  (req: Request, res: Response, next: NextFunction) => {
    adminAuth.passwordReset(req, res, next);
  }
);

route.post(
  "/admin/reset-password",
  validate(ResetPasswordValidator),
  (req: Request, res: Response, next: NextFunction) => {
    adminAuth.resetPassword(req, res, next);
  }
);

export default route;
