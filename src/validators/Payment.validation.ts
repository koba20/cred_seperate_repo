import Joi from "joi";
import { objectId } from "./Custom.validator";
import {
  ADMIN_FUNDING_TYPE,
  PORTFOLIO,
  SCHEDULE,
  TRANSACTION_CATEGORIES,
} from "../../config/constants";

export const buyAirtime = {
  body: Joi.object({
    amount: Joi.number().positive().required(),
    phone: Joi.string().required().min(10).max(14),
    serviceID: Joi.string().required(),
  }),
};

export const addCard = {
  body: Joi.object().keys({
    number: Joi.string().creditCard().required().messages({
      "string.base": "Card number must be a string",
      "string.empty": "Card number cannot be empty",
      "any.required": "Card number is required",
      "string.creditCard": "Invalid card number",
    }),

    expMonth: Joi.number().integer().min(1).max(12).required().messages({
      "number.base": "Expiration month must be a number",
      "number.empty": "Expiration month cannot be empty",
      "number.min": "Expiration month must be between 1 and 12",
      "number.max": "Expiration month must be between 1 and 12",
      "any.required": "Expiration month is required",
    }),

    expYear: Joi.number()
      .integer()
      .min(new Date().getFullYear())
      .max(new Date().getFullYear() + 20) // Assuming a reasonable future year limit
      .required()
      .messages({
        "number.base": "Expiration year must be a number",
        "number.empty": "Expiration year cannot be empty",
        "number.min": `Expiration year must be greater than or equal to ${new Date().getFullYear()}`,
        "number.max": "Expiration year is too far in the future",
        "any.required": "Expiration year is required",
      }),
    pin: Joi.string().min(4).max(4).required(),
    cvv: Joi.string()
      .pattern(/^[0-9]{3,4}$/)
      .required()
      .messages({
        "string.base": "CVV must be a string",
        "string.empty": "CVV cannot be empty",
        "string.pattern.base": "CVV must be 3 or 4 digits",
        "any.required": "CVV is required",
      }),

    idenpotentkey: Joi.string().required(),
  }),
};

export const addCardVerify = {
  body: Joi.object().keys({
    card: Joi.custom(objectId).required(),
    otp: Joi.string().min(5).max(5).required(),
  }),
};

export const getVariations = {
  body: Joi.object().keys({
    serviceID: Joi.string().required(),
  }),
};

export const withdrawal = {
  body: Joi.object().keys({
    amount: Joi.number().required().positive(),
    idempotentKey: Joi.string().required().min(16),
    accountBank: Joi.string().required(),
    accountNumber: Joi.string().required(),
    purpose: Joi.string(),
  }),
};

export const getFee = {
  body: Joi.object().keys({
    amount: Joi.number().required().positive(),
  }),
};

export const inAppTransfer = {
  body: Joi.object().keys({
    amount: Joi.number().required().positive(),
    idempotentKey: Joi.string().required().min(16),
    username: Joi.string().required(),
    purpose: Joi.string(),
  }),
};

export const giftUser = {
  body: Joi.object().keys({
    amount: Joi.number().required().positive(),
    idempotentKey: Joi.string().required().min(16),
    user: Joi.string().required(),
    purpose: Joi.string(),
  }),
};

export const validateAccount = {
  body: Joi.object().keys({
    bank: Joi.string().required(),
    account: Joi.string().required(),
  }),
};

export const validateusername = {
  body: Joi.object().keys({
    username: Joi.string().required(),
  }),
};

// export const getTransactions = {
//   query: Joi.object().keys({
//     type: Joi.string(),
//     user: Joi.string(),
//     source: Joi.string(),
//     startDate: Joi.string(),
//     endDate: Joi.string(),
//     page: Joi.string().default(1),
//     limit: Joi.string().default(10),
//     orderBy: Joi.string(),
//     ignorePaginate: Joi.boolean().default(false),
//     populate: Joi.array(),
//     category: Joi.string().valid(...Object.values(TRANSACTION_CATEGORIES)),
//   }),
// };

export const purchaseUtilities = {
  body: Joi.object().keys({
    amount: Joi.number().required().positive(),
    serviceID: Joi.string().required(),
    billersCode: Joi.string().required(),
    phone: Joi.string().required(),
    // ------ optional parameters -------
    variation_code: Joi.string().optional(),
    subscription_type: Joi.string().optional(), // for renewing TV Sub
  }),
};

export const validateCustomerReference = {
  body: Joi.object().keys({
    billersCode: Joi.string().required(),
    serviceID: Joi.string().required(),
    type: Joi.string().optional(),
  }),
};

export const getUtilitiesProvidersServices = {
  body: Joi.object().keys({
    merchantId: Joi.string(),
    referenceNumber: Joi.string(),
  }),
};

export const validatePaymentCallback = {
  body: Joi.object().keys({
    status: Joi.string().required(),
    transactionId: Joi.string().required(),
    txRef: Joi.string().required(),
    idempotentKey: Joi.string().required().min(16),
  }),
};

export const createTransactionPin = {
  body: Joi.object().keys({
    pin: Joi.string().required().min(4).max(4),
    confirm: Joi.string().required().min(4).max(4),
  }),
};
export const validateTransactionPin = {
  body: Joi.object().keys({
    pin: Joi.string().required().min(4).max(4),
  }),
};

export const createSchedule = {
  body: Joi.object().keys({
    amount: Joi.number().required().positive(),
    interval: Joi.number().required(),
    duration: Joi.string()
      .required()
      .valid(...Object.values(SCHEDULE)),
    startDate: Joi.date().required(),
    beneficiaries: Joi.array().items(Joi.custom(objectId)).required(),
    name: Joi.string().required(),
  }),
};

export const bulkSchedulePayment = {
  body: Joi.object().keys({
    amount: Joi.number().required().positive(),
    state: Joi.string().required(),
    lga: Joi.string().optional(),
    pollingUnit: Joi.string().optional(),
    senatorialDistrict: Joi.string().optional(),
    ward: Joi.string().optional(),
    purpose: Joi.string().required(),
  }),
};

export const adminInAppFunding = {
  body: Joi.object().keys({
    fundingType: Joi.string()
      .valid(...Object.values(ADMIN_FUNDING_TYPE))
      .required(),
    transactionCategory: Joi.string()
      .valid(...Object.values(TRANSACTION_CATEGORIES))
      .required(),
    purpose: Joi.string().required(),
    account: Joi.string()
      .valid("LEDGER_BALANCE", "AVAILABLE_BALANCE")
      .required(),
    amount: Joi.when("fundingType", {
      is: ADMIN_FUNDING_TYPE.SINGLE_USER,
      then: Joi.number().required().positive(),
    }),
    idempotentKey: Joi.string().required().min(16),
    username: Joi.when("fundingType", {
      is: ADMIN_FUNDING_TYPE.SINGLE_USER,
      then: Joi.string().required(),
    }),
    bulkFunding: Joi.when("fundingType", {
      is: ADMIN_FUNDING_TYPE.BULK,
      then: Joi.array()
        .items(
          Joi.object()
            .keys({
              amount: Joi.number().required().positive(),
              username: Joi.string().required(),
            })
            .required()
        )
        .required(),
    }),
    groupFunding: Joi.when("fundingType", {
      is: ADMIN_FUNDING_TYPE.GROUP,
      then: Joi.object()
        .keys({
          portfolio: Joi.string()
            .valid(...Object.values(PORTFOLIO))
            .required(),
          amount: Joi.when("transactionCategory", {
            not: TRANSACTION_CATEGORIES.SALARY,
            then: Joi.number().required().positive(),
          }),
          state: Joi.when("transactionCategory", {
            not: TRANSACTION_CATEGORIES.SALARY,
            then: Joi.string().required(),
          }),
          lga: Joi.string().optional(),
          pollingUnit: Joi.string().optional(),
          ward: Joi.string().optional(),
        })
        .required(),
    }),
  }),
};

export const lockUserWallet = {
  body: Joi.object().keys({
    locked: Joi.boolean().required(),
    reason: Joi.string().required(),
  }),
};

export const userKyc = {
  body: Joi.object().keys({
    bvn: Joi.string().required().min(11).max(11),
  }),
};
