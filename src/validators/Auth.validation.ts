import Joi from "joi";
import { ADMIN_ROLE, GENDER, PORTFOLIO } from "../../config/constants";

export const LoginValidator = {
  body: Joi.object().keys({
    identifier: Joi.string().required(),
    password: Joi.string().min(8).required().messages({
      "string.min": "Oops!, password must be at least 8 characters long",
      "any.required": "Oops!, you have to specify a password",
    }),
  }),
};

export const AdminLoginValidator = {
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      "string.email": "Oops!, you need to provide valid email address",
      "string.required": "Oops!, you have to specify an email address",
    }),
    password: Joi.string().min(8).required().messages({
      "string.min": "Oops!, password must be at least 8 characters long",
    }),
  }),
};

export const CreateUserValidator = {
  body: Joi.object().keys({
    firstName: Joi.string().min(3).max(40).required(),
    lastName: Joi.string().min(3).max(40).required(),
    middleName: Joi.string().min(3).max(40).optional(),
    username: Joi.string().min(3).lowercase().max(40).required(),
    email: Joi.string().email().lowercase().required().messages({
      "string.email": "Oops!, you need to provide valid email address",
      "string.required": "Oops!, you have to specify an email address",
    }),
    phoneNumber: Joi.string().min(10).max(14).strict().required().messages({
      "string.required": "Oops!, you have to specify a phone number",
    }),
    gender: Joi.string()
      .required()
      .valid(...Object.values(GENDER)),
    inviteCode: Joi.string().optional(),
    portfolio: Joi.string()
      .optional()
      .valid(...Object.values(PORTFOLIO)),
    organization: Joi.string().required(),
  }),
};

export const VerifyOtpValidator = {
  body: Joi.object().keys({
    otp: Joi.string().required().min(4).max(4),
  }),
};

export const RegisterOtpValidator = {
  body: Joi.object().keys({
    otp: Joi.string().required().min(4).max(4),
  }),
};

export const ResendUserEmailVerificationValidator = {
  body: Joi.object().keys({
    email: Joi.string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "net"] },
      })
      .lowercase()
      .required()
      .messages({
        "string.email": "Oops!, you need to provide valid email address",
        "string.required": "Oops!, you have to specify an email address",
      }),
  }),
};

export const RegenerateAccessToken = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export const ResetPasswordValidator = {
  body: Joi.object().keys({
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.ref("password"),
    token: Joi.string().required(),
  }),
};

export const createValidator = {
  body: Joi.object().keys({
    password: Joi.string()
      .min(8)
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
        )
      )
      .required()
      .messages({
        "string.pattern.base":
          "Oops!, password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number and one special character",
        "string.required": "Oops!, you have to specify a password",
      }),
    phoneNumber: Joi.when("modeOfReset", {
      is: "phoneNumber",
      then: Joi.string().max(15).min(11).strict().required().messages({
        "any.required": "Oops!, you have to specify a phone number",
      }),
    }),
  }),
};

export const verifyUserEmailValidator = {
  body: Joi.object().keys({
    otp: Joi.string().required(),
  }),
};

export const forgotPasswordValidator = {
  body: Joi.object().keys({
    phoneNumber: Joi.string().min(10).max(14).strict().required().messages({
      "string.required": "Oops!, you have to specify a phone number",
    }),
  }),
};

export const resendOtpValidator = {
  body: Joi.object().keys({
    email: Joi.string().email().lowercase().required().messages({
      "any.required": "Oops!, you have to specify an email address",
    }),
  }),
};

export const createAdminValidator = {
  body: Joi.object().keys({
    firstName: Joi.string().min(3).lowercase().max(40).required(),
    lastName: Joi.string().min(3).lowercase().max(40).required(),
    middleName: Joi.string().min(3).lowercase().max(40).optional(),
    email: Joi.string().email().lowercase().required().messages({
      "string.email": "Oops!, you need to provide valid email address",
      "string.required": "Oops!, you have to specify an email address",
    }),
    phoneNumber: Joi.string().min(10).max(14).strict().required().messages({
      "string.required": "Oops!, you have to specify a phone number",
    }),
    gender: Joi.string().valid(...Object.values(GENDER)),
    /** Password requirements:
     * At least 8 characters—the more characters, the better
     * A mixture of both uppercase and lowercase - letters
     * A mixture of letters and numbers
     * Inclusion of at least one special character, e.g., ! @ # ? ]
     */
    password: Joi.string()
      .min(8)
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&-_+=*])(?=.{8,})"
        )
      )
      .required()
      .messages({
        "string.pattern.base":
          "Oops!, password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number and one special character",
        "string.required": "Oops!, you have to specify a password",
      }),
    confirmPassword: Joi.ref("password"),
    role: Joi.string()
      .required()
      .valid(...Object.values(ADMIN_ROLE)),
  }),
};

export const updateAdmin = {
  body: Joi.object().keys({
    firstName: Joi.string().min(3).lowercase().max(40).optional(),
    lastName: Joi.string().min(3).lowercase().max(40).optional(),
    middleName: Joi.string().min(3).lowercase().max(40).optional(),
    email: Joi.string().email().lowercase().optional().messages({
      "string.email": "Oops!, you need to provide valid email address",
      "string.optional": "Oops!, you have to specify an email address",
    }),
    phoneNumber: Joi.string().min(10).max(14).strict().optional().messages({
      "string.optional": "Oops!, you have to specify a phone number",
    }),
    /** Password requirements:
     * At least 8 characters—the more characters, the better
     * A mixture of both uppercase and lowercase - letters
     * A mixture of letters and numbers
     * Inclusion of at least one special character, e.g., ! @ # ? ]
     */
    oldPassword: Joi.when("password", {
      is: Joi.exist(),
      then: Joi.string()
        .min(8)
        .pattern(
          new RegExp(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&-_=+~*])(?=.{8,})"
          )
        )
        .required()
        .messages({
          "string.pattern.base":
            "Oops!, password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number and one special character",
          "string.required": "Oops!, you have to specify a password",
        }),
    }),
    password: Joi.string()
      .min(8)
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
        )
      )
      .optional()
      .messages({
        "string.pattern.base":
          "Oops!, password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number and one special character",
        "string.optional": "Oops!, you have to specify a password",
      }),
    confirmPassword: Joi.when("password", {
      is: Joi.exist(),
      then: Joi.ref("password"),
    }),
    role: Joi.string()
      .valid(...Object.values(ADMIN_ROLE))
      .optional(),
    accountStatus: Joi.object().keys({
      status: Joi.string().required(),
      reason: Joi.string().required(),
    }),
    avatar: Joi.string().optional(),
  }),
};
