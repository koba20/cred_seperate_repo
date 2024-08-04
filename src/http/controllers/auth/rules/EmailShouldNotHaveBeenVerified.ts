import { NextFunction } from 'express';
import AppException from '../../../../exceptions/AppException';
import httpStatus from 'http-status';

type Account = { email: string };
const AccountEmailShouldNotHaveBeenVerified = (
  account: Account,
  next: NextFunction,
) => {
  return next(
    new AppException(
      `Account email: ${account.email} has already been verified`,
      httpStatus.EXPECTATION_FAILED,
    ),
  );
};

export default AccountEmailShouldNotHaveBeenVerified;
