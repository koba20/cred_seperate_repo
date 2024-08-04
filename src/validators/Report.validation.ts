import Joi from 'joi';
import { objectId } from './Custom.validator';
import { REPORT_CATEGORY } from '../../config/constants';

export const postReport = {
  body: Joi.object().keys({
    category: Joi.string()
      .required()
      .valid(...Object.values(REPORT_CATEGORY)),
    post: Joi.when('category', {
      is: REPORT_CATEGORY.POST,
      then: Joi.custom(objectId).required(),
    }),
    transaction: Joi.when('category', {
      is: REPORT_CATEGORY.TRANSACTION,
      then: Joi.custom(objectId).required(),
    }),
    shop: Joi.when('category', {
      is: REPORT_CATEGORY.SHOP,
      then: Joi.custom(objectId).required(),
    }),
    reportedUser: Joi.when('category', {
      is: REPORT_CATEGORY.USER,
      then: Joi.custom(objectId).required(),
    }),
    product: Joi.when('category', {
      is: REPORT_CATEGORY.PRODUCT,
      then: Joi.custom(objectId).required(),
    }),
    reason: Joi.string().required(),
    description: Joi.string().required(),
  }),
};
