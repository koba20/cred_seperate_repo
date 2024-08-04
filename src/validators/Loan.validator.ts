import Joi from "joi";
import { LOAN_STATUS } from "../../config/constants";
import { objectId } from "./Custom.validator";

export const requestLoanValidator = {
  body: Joi.object().keys({
    amount: Joi.number().positive().required(),
    reason: Joi.string().optional(),
    duration: Joi.number().positive().required(),
  }),
};
export const resonseValidator = {
  body: Joi.object().keys({
    loan: Joi.custom(objectId).required(),
    reason: Joi.string().required(),
    response: Joi.valid(...Object.values(LOAN_STATUS)),
  }),
};

export const cancelLoanValidator = {
  body: Joi.object().keys({
    loan: Joi.custom(objectId).required(),
  }),
};
export const loanRepaymentValidator = {
  body: Joi.object().keys({
    loan: Joi.custom(objectId).required(),
    amount: Joi.number().positive().required(),
    idempotentKey: Joi.string().required(),
  }),
};
