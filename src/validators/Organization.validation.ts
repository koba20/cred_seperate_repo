import Joi from "joi";

export const createOrganization = {
  body: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().lowercase().optional().messages({
      "string.email": "Oops!, you need to provide valid email address",
      "string.optional": "Oops!, you have to specify an email address",
    }),
    phoneNumber: Joi.string().required().min(10).max(14),
    percentage: Joi.number().optional(),
    coperate: Joi.object().keys({
      rcNumber: Joi.string().required(),
    }),
    loanInfo: Joi.object().keys({
      feeRate: Joi.number().required(),
      interest: Joi.number().required(),
      creditLimit: Joi.number().required(),
    }),
    repaymentInfo: Joi.object()
      .keys({
        payday: Joi.number().min(1).max(31),
      })
      .required(),
    hr: Joi.object().keys({
      firstName: Joi.string().min(3).lowercase().max(40).optional(),
      lastName: Joi.string().min(3).lowercase().max(40).optional(),
      middleName: Joi.string().min(3).lowercase().max(40).optional(),
      email: Joi.string().email().lowercase().optional().messages({
        "string.email": "Oops!, you need to provide valid email address",
        "string.optional": "Oops!, you have to specify an email address",
      }),
    }),
  }),
};

export const updateOrganization = {
  body: Joi.object().keys({
    name: Joi.string().min(3).lowercase().max(40).optional(),
    email: Joi.string().email().lowercase().optional().messages({
      "string.email": "Oops!, you need to provide valid email address",
      "string.optional": "Oops!, you have to specify an email address",
    }),
    phoneNumber: Joi.string().min(10).max(14).strict().optional().messages({
      "string.optional": "Oops!, you have to specify a phone number",
    }),

    loanInfo: Joi.object().keys({
      interest: Joi.number().optional(),
    }),

    accountStatus: Joi.object().keys({
      status: Joi.string().required(),
      reason: Joi.string().required(),
    }),
    coperate: Joi.object().keys({
      rcNumber: Joi.string().optional(),
    }),
    hrInfo: Joi.object().keys({
      firstName: Joi.string().min(3).lowercase().max(40).optional(),
      lastName: Joi.string().min(3).lowercase().max(40).optional(),
      middleName: Joi.string().min(3).lowercase().max(40).optional(),
      email: Joi.string().email().lowercase().optional().messages({
        "string.email": "Oops!, you need to provide valid email address",
        "string.optional": "Oops!, you have to specify an email address",
      }),
    }),
    logo: Joi.string().optional(),
  }),
};
