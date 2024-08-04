import { NextFunction, Response } from 'express';
import ScheduleService from '../../services/Schedule.service';
import { RequestType } from '../middlewares/auth.middleware';
import AppException from '../../exceptions/AppException';
import httpStatus from 'http-status';
import HelperClass from '../../utils/helper';
import moment from 'moment';
import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  TRANSACTION_CATEGORIES,
  SCHEDULE_STATUS,
} from '../../../config/constants';
import pick from '../../utils/pick';
import PaymentService from '../../services/payment.service';
import generateTxRef from '../../utils/generateTxRef';
import User from '../../database/models/User.model';
import EmailService from '../../services/Email.service';
import { CURRENCIES } from '../../../config/constants';

export default class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly paymentService: PaymentService,
    private readonly emailService: EmailService
  ) {}

  async createSchedule(req: RequestType, res: Response, next: NextFunction) {
    try {
      req.body.creator = req.user._id;
      req.body.scheduleCode = `sch-${HelperClass.generateRandomChar(6, 'num')}`;

      const amountDebitedFromCreator = Number(
        Number(
          req.body.amount * req.body.beneficiaries.length * req.body.interval
        ).toFixed(2)
      );

      const startDate = moment(req.body.startDate).utc().startOf('day');
      const today = moment().utc().startOf('day');
      req.body.startDate = startDate.toDate();
      today.isSame(startDate, 'day')
        ? (req.body.startDate = moment()
            .utc()
            .add(1, 'day')
            .startOf('day')
            .toDate())
        : (req.body.startDate = startDate.toDate());

      // Remove this later
      // req.body.startDate = startDate.toDate();

      const creatorAccountInfo = await this.paymentService.queryAccountInfo({
        user: req.user.id,
      });
      if (!creatorAccountInfo) {
        return next(
          new AppException(
            'You do not have a valid account',
            httpStatus.BAD_REQUEST
          )
        );
      }
      if (amountDebitedFromCreator <= creatorAccountInfo.availableBalance) {
        const updatedAccountBalance = Number(
          Number(
            creatorAccountInfo.availableBalance - amountDebitedFromCreator
          ).toFixed(2)
        );

        await this.paymentService.updateAvailableBalance(
          updatedAccountBalance,
          {
            user: req.user._id,
          }
        );
        await this.paymentService.updateReservedBalance(
          creatorAccountInfo.reservedBalance + amountDebitedFromCreator,
          { user: req.user._id }
        );

        const txRef = generateTxRef(16, 'num');
        const schedule = await this.scheduleService.createSchedule(req.body);
        await this.paymentService.createTransactionLog({
          user: creatorAccountInfo.user,
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          type: TRANSACTION_TYPES.DEBIT,
          amount: amountDebitedFromCreator,
          purpose: `Scheduled payment for ${HelperClass.titleCase(
            schedule.name
          )}`,
          reference: txRef,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          category: TRANSACTION_CATEGORIES.BULK_SCHEDULE,
          balanceAfterTransaction: updatedAccountBalance,
          meta: {
            currency: CURRENCIES.NGN,
            schedule: schedule._id,
          },
        });

        return res
          .status(httpStatus.CREATED)
          .json({ status: 'Schedule created successfully', schedule });
      }
      return next(
        new AppException(
          `Oops! you don't have enough funds to complete this transaction`,
          httpStatus.BAD_REQUEST
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getSchedule(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = pick(req.query, [
        'scheduleCode',
        'status',
        'creator',
        'beneficiaries',
      ]);
      const options = pick(req.query, ['orderBy', 'limit', 'page', 'populate']);
      if ('beneficiaries' in filter && req.query.beneficiaries) {
        filter.beneficiaries = { $in: [req.query.beneficiaries] };
      }

      const data = await this.scheduleService.getAllSchedule(filter, options);
      return res.status(httpStatus.OK).json({ status: 'success', data });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async bulkPayment(req: RequestType, res: Response, next: NextFunction) {
    try {
      const {
        state,
        lga,
        senatorialDistrict,
        pollingUnit,
        ward,
        purpose,
        amount,
      } = req.body;

      const users = await User.aggregate([
        ...(state
          ? [
              {
                $match: { 'votingAddress.state': state },
              },
            ]
          : []),
        ...(lga
          ? [
              {
                $match: { 'votingAddress.lga': lga },
              },
            ]
          : []),
        ...(senatorialDistrict
          ? [
              {
                $match: {
                  'votingAddress.senatorialDistrict': senatorialDistrict,
                },
              },
            ]
          : []),
        ...(pollingUnit
          ? [
              {
                $match: {
                  'votingAddress.pollingUnit': pollingUnit,
                },
              },
            ]
          : []),
        ...(ward
          ? [
              {
                $match: {
                  'address.ward': ward,
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: 'accounts',
            localField: '_id',
            foreignField: 'user',
            as: 'account',
          },
        },
        {
          $unwind: {
            path: '$account',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            __v: 0,
            __t: 0,
            t: 0,
            password: 0,
            verificationToken: 0,
          },
        },
      ]);

      if (users.length <= 0)
        throw new Error('Oops! no user found that matches this condition');

      const creatorAccountInfo = await this.paymentService.queryAccountInfo({
        user: req.user.id,
      });
      if (!creatorAccountInfo) {
        return next(
          new AppException(
            'You do not have a valid account',
            httpStatus.BAD_REQUEST
          )
        );
      }
      let amountDebitedFromCreator = Number(
        Number(amount * users.length).toFixed(2)
      );

      if (amountDebitedFromCreator <= creatorAccountInfo.availableBalance) {
        const usersThatGotPaid = [];
        const unpaidUsers: { [key: string]: string }[] = [];
        /** credit the users selected */
        for (const user of users) {
          const userAccountInfo = await this.paymentService.queryAccountInfo({
            user: user._id,
          });
          if (!userAccountInfo) {
            unpaidUsers.push({
              name: `${user.lastName} ${user.firstName}`,
            });
            return false;
          }
          const updatedUserAccountBalance = Number(
            Number(userAccountInfo.availableBalance + amount).toFixed(2)
          );
          await this.paymentService.updateAvailableBalance(
            updatedUserAccountBalance,
            {
              user: user._id,
            }
          );
          const txRef = generateTxRef(24, 'num');
          await this.paymentService.createTransactionLog({
            user: user._id,
            source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
            type: TRANSACTION_TYPES.CREDIT,
            amount,
            purpose,
            reference: txRef,
            status: TRANSACTION_STATUS.SUCCESSFUL,
            category: TRANSACTION_CATEGORIES.SCHEDULE_PAYMENT,
            balanceAfterTransaction: updatedUserAccountBalance,
            meta: {
              currency: CURRENCIES.NGN,
              payerName: `${req.user.lastName} ${req.user.firstName}`,
              reference: txRef,
              transactionType: 'Bulk Schedule',
            },
          });
          usersThatGotPaid.push(user);
          const message = `${amount} NGN was credited to your wallet by ${req.user.lastName} ${req.user.firstName}`;
          this.emailService.sendUserAccountCreditedEmail(
            user.email,
            `${HelperClass.titleCase(user.lastName)} ${HelperClass.titleCase(
              user.firstName
            )}`,
            message
          );
        }
        amountDebitedFromCreator = Number(
          (amount * usersThatGotPaid.length).toFixed(2)
        );
        const updatedAccountBalance = Number(
          Number(
            creatorAccountInfo.availableBalance - amountDebitedFromCreator
          ).toFixed(2)
        );

        /** Debit the creator */
        await this.paymentService.updateAvailableBalance(
          updatedAccountBalance,
          {
            user: req.user._id,
          }
        );

        const txRef = generateTxRef(16, 'num');
        await this.paymentService.createTransactionLog({
          user: creatorAccountInfo.user,
          source: TRANSACTION_SOURCES.AVAILABLE_BALANCE,
          type: TRANSACTION_TYPES.DEBIT,
          amount: amountDebitedFromCreator,
          purpose: purpose,
          reference: txRef,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          category: TRANSACTION_CATEGORIES.GROUP_SCHEDULE,
          balanceAfterTransaction: updatedAccountBalance,
          meta: {
            currency: CURRENCIES.NGN,
            schedule: 'GROUP_SCHEDULE',
            totalBeneficiaries: usersThatGotPaid.length,
            beneficiaries: usersThatGotPaid,
          },
        });
        this.emailService.paymentUnsuccessfulEmail(
          req.user.email,
          `${req.user.firstName} ${req.user.lastName}`,
          unpaidUsers
        );
        return res
          .status(httpStatus.OK)
          .json({ status: 'success', message: 'Payment successful' });
      }
      return next(
        new AppException(
          `Oops! you don't have enough funds to complete this transaction`,
          httpStatus.BAD_REQUEST
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async deleteSchedule(req: RequestType, res: Response, next: NextFunction) {
    try {
      const isScheduleActive = await this.scheduleService.querySchedule({
        status: SCHEDULE_STATUS.ACTIVE,
        _id: req.params.scheduleId,
      });

      if (isScheduleActive) {
        return next(
          new AppException(
            'Oops!, you cant delete an active schedule',
            httpStatus.BAD_REQUEST
          )
        );
      }
      await this.scheduleService.deleteScheduleById(req.params.scheduleId);
      return res.status(httpStatus.OK).json({
        status: 'success',
        message: 'Schedule deleted successfully',
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }
}
