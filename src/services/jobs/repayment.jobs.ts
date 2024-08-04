import config from "../../../config/config";
import EmailService from "../Email.service";
import EncryptionService from "../Encryption.service";
import FlutterwaveClient from "../flutterwave/Flutterwave.client";
import KoraClient from "../kora/Kora.client";
import PaymentService from "../payment.service";
import UserService from "../User.service";
import VtpassClient from "../vtpass/Vtpass.client";

const paymentService = new PaymentService(
  new FlutterwaveClient({
    pkey: config.paymentData.fpkey,
    skey: config.paymentData.fskey,
    enkey: config.paymentData.fekey,
    test: false,
  }),
  new KoraClient({
    pkey: config.paymentData.korapkey,
    skey: config.paymentData.koraskey,
    enkey: config.paymentData.koraekey,
    test: false,
  }),
  new EmailService(),
  new UserService(),
  new VtpassClient({ skey: config.paymentData.vtpasskey }),
  new EncryptionService()
);

const emailService = new EmailService();
const userService = new UserService();

const LoanRepaymentJob = () => {

    console.log(emailService);
    console.log(userService)
    console.log(paymentService);
  //   const skillUp = cronJob.schedule(config.cronSchedule.skillUp, async () => {
  //     const inactiveSkillUpFilter = {
  //       status: SKILL_UP_STATUS.INACTIVE,
  //       "duration.startDate": {
  //         $gte: moment().utc().startOf("day").toDate(),
  //       },
  //     };
  //     const inactiveSkillUps = await skillUpService.querySkillUp(
  //       inactiveSkillUpFilter
  //     );
  //     await Promise.all(
  //       inactiveSkillUps.map(async (skillUp) => {
  //         skillUp.status = SKILL_UP_STATUS.ACTIVE;
  //         await skillUp.save();
  //       })
  //     );
  //     const activeSkillUpFilter = {
  //       status: SKILL_UP_STATUS.ACTIVE,
  //       "duration.endDate": {
  //         $lte: moment().utc().endOf("day").toDate(),
  //       },
  //     };
  //     const activeSkillUps = await skillUpService.querySkillUp(
  //       activeSkillUpFilter
  //     );
  //     await Promise.all(
  //       activeSkillUps.map(async (_) => {
  //         // skillUp used to be here -- >
  //         // skillUp.status = SKILL_UP_STATUS.ENDED; // Set To Ended -- >
  //         // await skillUp.save();
  //       })
  //     );
  //   });
  //   skillUp.start();
  //   const schedule = cronJob.schedule(config.cronSchedule.schedule, async () => {
  //     const activateScheduleFilter = {
  //       status: SCHEDULE_STATUS.INACTIVE,
  //       deletedAt: null as null,
  //     };
  //     Object.assign(activateScheduleFilter, {
  //       startDate: {
  //         $gte: moment().utc().startOf("day").toDate(),
  //         $lte: moment().utc().endOf("day").toDate(),
  //       },
  //     });
  //     const activateSchedule = (await scheduleService.getAllSchedule(
  //       activateScheduleFilter,
  //       {},
  //       true
  //     )) as ScheduleInterface[];
  //     await Promise.all(
  //       activateSchedule.map(async (schedule) => {
  //         const updateBody = {
  //           status: SCHEDULE_STATUS.ACTIVE,
  //           nextChargeDate: schedule.startDate,
  //         };
  //         await scheduleService.updateScheduleById(schedule._id, updateBody);
  //       })
  //     );
  //     const initiateSchedulePaymentFilter = {
  //       status: SCHEDULE_STATUS.ACTIVE,
  //       deletedAt: null as null,
  //     };
  //     Object.assign(initiateSchedulePaymentFilter, {
  //       nextChargeDate: {
  //         $gte: moment().utc().startOf("day").toDate(),
  //         $lte: moment().utc().endOf("day").toDate(),
  //       },
  //     });
  //     const initiateSchedulePayment = (await scheduleService.getAllSchedule(
  //       initiateSchedulePaymentFilter,
  //       {},
  //       true
  //     )) as ScheduleInterface[];
  //     if (initiateSchedulePayment.length > 0) {
  //       await Promise.all(
  //         initiateSchedulePayment.map(async (schedule) => {
  //           const scheduleCreator = await userService.getUserById(
  //             schedule.creator as string
  //           );
  //           if (schedule.timesBilled < schedule.interval) {
  //             const schedulePayment =
  //               await paymentService.initiateScheduledPayment(
  //                 schedule,
  //                 schedule.creator as string
  //               );
  //             if (schedulePayment) {
  //               const { nextChargeDate } = HelperClass.calculateSchedulePeriod(
  //                 schedule.duration
  //               );
  //               const updateBody = {
  //                 nextChargeDate,
  //                 lastChargeDate: moment().utc().startOf("day").toDate(),
  //                 timesBilled: schedule.timesBilled + 1,
  //               };
  //               await scheduleService.updateScheduleById(
  //                 schedule._id,
  //                 updateBody
  //               );
  //             }
  //           } else {
  //             const updateBody = {
  //               status: SCHEDULE_STATUS.ENDED,
  //             };
  //             await scheduleService.updateScheduleById(schedule._id, updateBody);
  //             const message = `Your scheduled payment - ${schedule.name} has ended`;
  //             await emailService.scheduleEndedEmail(
  //               scheduleCreator.email,
  //               `${scheduleCreator.firstName} ${scheduleCreator.lastName}`,
  //               message
  //             );
  //           }
  //         })
  //       );
  //     }
  //     /** Get ended schedules and revert user's reserved balance to available balance */
  //     const endedSchedulesFilter = {
  //       status: SCHEDULE_STATUS.ENDED,
  //       deletedAt: null as null,
  //     };
  //     const endedSchedules = (await scheduleService.getAllSchedule(
  //       endedSchedulesFilter as unknown as Record<string, unknown>,
  //       {},
  //       true
  //     )) as ScheduleInterface[];
  //     if (endedSchedules.length > 0) {
  //       await Promise.all(
  //         endedSchedules.map(async (schedule) => {
  //           const scheduleCreator = await userService.getUserById(
  //             schedule.creator as string
  //           );
  //           const scheduleCreatorAccountInfo =
  //             await paymentService.queryAccountInfo({
  //               user: scheduleCreator._id as string,
  //             });
  //           const beneficiaries = (await userService.getAllUsers(
  //             {
  //               _id: { $in: schedule.beneficiaries } as unknown as string[],
  //               deletedAt: null,
  //             },
  //             {},
  //             true
  //           )) as User[];
  //           if (beneficiaries.length === 0)
  //             throw new Error("Oops!, no beneficiaries found for this schedule");
  //           let totalNumberOfBeneficiaries = beneficiaries.length;
  //           await Promise.all(
  //             beneficiaries.map(async (beneficiary) => {
  //               const beneficiariesAccountInfo =
  //                 await paymentService.queryAccountInfo({
  //                   user: beneficiary._id as string,
  //                 });
  //               if (
  //                 !beneficiariesAccountInfo ||
  //                 beneficiariesAccountInfo === null
  //               )
  //                 totalNumberOfBeneficiaries -= 1;
  //             })
  //           );
  //           // for (
  //           //   let beneficiary = 0;
  //           //   beneficiary < beneficiaries.length;
  //           //   beneficiary++
  //           // ) {
  //           //   const beneficiariesAccountInfo =
  //           //     await paymentService.queryAccountInfo({
  //           //       user: beneficiaries[beneficiary]._id as string,
  //           //     });
  //           //   if (!beneficiariesAccountInfo || beneficiariesAccountInfo === null)
  //           //     totalNumberOfBeneficiaries -= 1;
  //           // }
  //           const moneyGivenToBeneficiaries = Math.floor(
  //             schedule.amount * totalNumberOfBeneficiaries * schedule.interval
  //           );
  //           const amountReservedForThisSchedule =
  //             schedule.amount * beneficiaries.length * schedule.interval;
  //           const creditScheduleCreatorBalance =
  //             amountReservedForThisSchedule - moneyGivenToBeneficiaries;
  //           await paymentService.updateAvailableBalance(
  //             scheduleCreatorAccountInfo.availableBalance +
  //               creditScheduleCreatorBalance,
  //             { user: scheduleCreator._id }
  //           );
  //           await paymentService.updateReservedBalance(
  //             scheduleCreatorAccountInfo.reservedBalance -
  //               creditScheduleCreatorBalance,
  //             { user: scheduleCreator._id }
  //           );
  //           /** Create a transaction log */
  //           const message = `Your scheduled payment - ${schedule.name} has ended, ${creditScheduleCreatorBalance} ${CURRENCIES.RCOIN} was credited to your Sinnts wallet from your reserved balance, you can withdraw it to your bank account or mobile money account or pay for utilities on the platform if you wish to. Thank you for using Sinnts.`;
  //           await paymentService.createTransactionLog({
  //             amount: creditScheduleCreatorBalance,
  //             type: TRANSACTION_TYPES.CREDIT,
  //             source: TRANSACTION_SOURCES.RESERVED_BALANCE,
  //             user: scheduleCreator._id,
  //             purpose: message,
  //             reference: generateTxRef(16, "num"),
  //             status: TRANSACTION_STATUS.SUCCESSFUL,
  //             category: TRANSACTION_CATEGORIES.BULK_SCHEDULE,
  //             balanceAfterTransaction:
  //               scheduleCreatorAccountInfo.availableBalance +
  //               creditScheduleCreatorBalance,
  //             meta: {
  //               schedule: schedule._id,
  //               transactionType: `SCHEDULE_PAYMENT`,
  //               currency: CURRENCIES.RCOIN,
  //             },
  //           });
  //           await emailService.sendUserAccountCreditedEmail(
  //             scheduleCreator.email,
  //             `${scheduleCreator.lastName} ${scheduleCreator.firstName} `,
  //             message
  //           );
  //           const updateBody = {
  //             status: SCHEDULE_STATUS.COMPLETED,
  //           };
  //           await scheduleService.updateScheduleById(schedule._id, updateBody);
  //           return schedule;
  //         })
  //       );
  //     }
  //   });
  //   schedule.start();
  //   const poll = cronJob.schedule(config.cronSchedule.startPoll, async () => {
  //     const filter = {
  //       "timeline.startDate": {
  //         $gte: moment().utc().startOf("day").toDate(),
  //         $lte: moment().utc().endOf("day").toDate(),
  //       },
  //       status: POLL_STATUS.PENDING,
  //     };
  //     const polls = await Poll.find(filter);
  //     await Promise.all(
  //       polls.map(async (poll) => {
  //         poll.status = POLL_STATUS.ONGOING;
  //         await poll.save();
  //         const user = await userService.getUserById(poll.user as string);
  //         const message = `Your poll - ${poll.title} has started`;
  //         await emailService.sendPollStartedEmail(
  //           user.email,
  //           `${user.firstName} ${user.lastName}`,
  //           message
  //         );
  //       })
  //     );
  //     const filter2 = {
  //       "timeline.endDate": {
  //         $gte: moment().utc().startOf("day").toDate(),
  //         $lte: moment().utc().endOf("day").toDate(),
  //       },
  //       status: POLL_STATUS.ONGOING,
  //     };
  //     const endingPolls = await Poll.find(filter2);
  //     await Promise.all(
  //       endingPolls.map(async (poll) => {
  //         poll.status = POLL_STATUS.COMPLETED;
  //         await poll.save();
  //         const user = await userService.getUserById(poll.user as string);
  //         const message = `Your poll - ${poll.title} has ended`;
  //         await emailService.sendPollStartedEmail(
  //           user.email,
  //           `${user.firstName} ${user.lastName}`,
  //           message
  //         );
  //       })
  //     );
  //   });
  //   poll.start();
};

export default LoanRepaymentJob;
