import { Router } from 'express';
import { isUserAuthenticated } from '../../middlewares/auth.middleware';
import { scheduleController } from '../../controllers/controllers.module';
import validate from '../../middlewares/validate';
import {
  createSchedule,
  bulkSchedulePayment,
} from '../../../validators/Payment.validation';

const router = Router();

router
  .route('/')
  .get(isUserAuthenticated, (req, res, next) => {
    scheduleController.getSchedule(req, res, next);
  })
  .post(isUserAuthenticated, validate(createSchedule), (req, res, next) => {
    scheduleController.createSchedule(req, res, next);
  });

router
  .route('/pay')
  .post(
    isUserAuthenticated,
    validate(bulkSchedulePayment),
    (req, res, next) => {
      scheduleController.bulkPayment(req, res, next);
    },
  );

router.route('/:scheduleId').delete(isUserAuthenticated, (req, res, next) => {
  scheduleController.deleteSchedule(req, res, next);
});

export default router;
