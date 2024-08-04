import { Router } from 'express';
import { isUserAuthenticated } from '../../middlewares/auth.middleware';
import { reportController } from '../../controllers/controllers.module';
import validate from '../../middlewares/validate';
import { postReport } from '../../../validators/Report.validation';

const router = Router();

router
  .route('/')
  .get(isUserAuthenticated, (req, res, next) => {
    reportController.getReports(req, res, next);
  })
  .post(isUserAuthenticated, validate(postReport), (req, res, next) => {
    reportController.createReport(req, res, next);
  });

export default router;
