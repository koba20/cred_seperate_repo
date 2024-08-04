import { Router } from 'express';
import authRoute from './auth.route';
import paymentRoute from './payment.route';
import userRoute from './user.route';
import reportRoute from './report.route';
import scheduleRoute from './schedule.route';
import adminRoute from './admin.route';
import organizationRoute from './organization.route';
import loanRoute from './loan.route';

const router = Router();

const defaultRoutes = [
  { path: '/auth', route: authRoute },
  { path: '/payment', route: paymentRoute },
  { path: '/user', route: userRoute },
  { path: '/admin', route: adminRoute },
  { path: '/report', route: reportRoute },
  { path: '/schedule', route: scheduleRoute },
  { path: '/loan', route: loanRoute},
  { path: '/organization', route: organizationRoute},
];

defaultRoutes.forEach(({ path, route }) => {
  router.use(path, route);
});

export default router;
