import {
  ACCOUNT_STATUS,
  GENDER,
  NOTIFICATION_TYPE,
  PORTFOLIO,
} from "../../config/constants";

import Joi from "joi";
import { objectId } from "./Custom.validator";

export const updateUserAccount = {
  body: Joi.object().keys({
    firstName: Joi.string().min(3).max(40).optional(),
    lastName: Joi.string().min(3).max(40).optional(),
    middleName: Joi.string().min(3).max(40).optional(),
    username: Joi.string().min(3).max(40).optional(),
    dob: Joi.date().optional(),
    settings: Joi.object()
      .keys({
        allowPushNotifications: Joi.boolean().default(true).required(),
      })
      .optional(),
    avatar: Joi.string().optional(),
    portfolio: Joi.string()
      .optional()
      .valid(...Object.values(PORTFOLIO)),
    gender: Joi.string()
      .optional()
      .valid(...Object.values(GENDER)),
    accountStatus: Joi.object()
      .keys({
        status: Joi.string()
          .optional()
          .valid(...Object.values(ACCOUNT_STATUS)),
        reason: Joi.string().optional(),
      })
      .optional(),
  }),
};

export const follow = {
  body: {
    user: Joi.custom(objectId),
  },
};

export const validateKyc = {
  body: {
    nin: Joi.string().required(),
    bvn: Joi.string().required(),
  },
};

export const sendNotification = {
  body: Joi.object().keys({
    notify: Joi.array().items(Joi.custom(objectId)).required(),
    message: Joi.string().required(),
    attachments: Joi.array().items(Joi.string()).optional(),
    title: Joi.string().required(),
    type: Joi.string()
      .required()
      .valid(...Object.values(NOTIFICATION_TYPE)),
  }),
};

export const joinOrganizationValidation = {
  body: Joi.object().keys({
    organization: Joi.custom(objectId).required(),
    role: Joi.string().required(),
    account: Joi.object().keys({
      accountNumber: Joi.string().min(10).max(10).required(),
      accountName: Joi.string().required(),
      bankName: Joi.string().required(),
      bankCode: Joi.string().required(),
    }),
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        "string.email": "Oops!, you need to provide valid email address",
        "string.required": "Oops!, you have to specify an email address",
      })
      .required(),
    salary: Joi.number().required(),
    staffID: Joi.string().required(),
  }),
};

export const sendBulkSms = {
  body: Joi.object().keys({
    notify: Joi.array().items(Joi.string()).required(),
    message: Joi.string().required(),
  }),
};

export const changePasswordValidator = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
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
    confirmPassword: Joi.ref("password"),
  }),
};

export const updateResolutionValidation = async (input: any) => {
  const schema = Joi.object({
    file: Joi.string()
      .valid("file_1x", "file_2x", "file_5x", "file_7x", "file_8x", "default")
      .required(),
  });
  try {
    await schema.validateAsync(input);
    return true; // Validation passed
  } catch (error: any) {
    return error.details[0].message; // Return validation error message
  }
};
