import { Router } from 'express';
import { isAdminAuthenticated } from '../../middlewares/auth.middleware';
import {
  adminController,

 
  notificationController,
  paymentController,
  reportController,
  userController,
} from '../../controllers/controllers.module';
import { restrictAdminAccessTo } from '../../middlewares/role.middleware';
import { ADMIN_ROLE } from '../../../../config/constants';
import {
  CreateUserValidator,
  createAdminValidator,
  updateAdmin,
} from '../../../validators/Auth.validation';
import validate from '../../middlewares/validate';
import {
  adminInAppFunding,
  lockUserWallet,
} from '../../../validators/Payment.validation';
import {
  sendBulkSms,
  sendNotification,
  updateUserAccount,
} from '../../../validators/User.validation';



const router = Router();

router
  .route('/notification')
  .get(isAdminAuthenticated, (req, res, next) => {
    notificationController.getNotifications(req, res, next);
  })
  .post(isAdminAuthenticated, validate(sendNotification), (req, res, next) => {
    notificationController.sendNotifications(req, res, next);
  });

router
  .route('/dashboard-summary')
  .get(isAdminAuthenticated, (req, res, next) => {
    adminController.getDashboardSummary(req, res, next);
  });

router
  .route('/transaction-summary')
  .get(isAdminAuthenticated, (req, res, next) => {
    adminController.getTransactionSummary(req, res, next);
  });

router
  .route('/reports')
  .get(isAdminAuthenticated, (req, res, next) => {
    reportController.getReports(req, res, next);
  })
  .patch(isAdminAuthenticated, (req, res, next) => {
    reportController.updateReport(req, res, next);
  });



router
  .route('/sms')
  .post(isAdminAuthenticated, validate(sendBulkSms), (req, res, next) => {
    notificationController.sendBulkSms(req, res, next);
  });



router
  .route('/wallet')
  .get(isAdminAuthenticated, (req, res, next) => {
    adminController.queryAdminWallet(req, res, next);
  })
  .patch(
    isAdminAuthenticated,
    restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    (req, res, next) => {
      adminController.updateAdminWallet(req, res, next);
    }
  );
router
  .route('/')
  .post(
   isAdminAuthenticated,
   restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    validate(createAdminValidator),
    (req, res, next) => {
      adminController.createAdmin(req, res, next);
    }
  )
  .get(
    isAdminAuthenticated,
    restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    (req, res, next) => {
      adminController.getAdmins(req, res, next);
    }
  );

router
  .route('/transactions')
  .get(
    isAdminAuthenticated,
    restrictAdminAccessTo(
      ADMIN_ROLE.SUPER_ADMIN,
      ADMIN_ROLE.TRANSACTION,
      ADMIN_ROLE.ENGINEER
    ),
    (req, res, next) => {
      paymentController.getTransactions(req, res, next);
    }
  );

router.route('/wallet-balance').get(isAdminAuthenticated, (req, res, next) => {
  adminController.getPagaWalletBalance(req, res, next);
});

router
  .route('/transaction/:id')
  .get(
    isAdminAuthenticated,
    restrictAdminAccessTo(
      ADMIN_ROLE.ENGINEER,
      ADMIN_ROLE.FINANCE,
      ADMIN_ROLE.TRANSACTION,
      ADMIN_ROLE.SUB_ADMIN
    ),
    (req, res, next) => {
      paymentController.getTransaction(req, res, next);
    }
  );

router
  .route('/funding')
  .post(
    isAdminAuthenticated,
    restrictAdminAccessTo(
      ADMIN_ROLE.SUPER_ADMIN,
      ADMIN_ROLE.TRANSACTION,
      ADMIN_ROLE.ENGINEER
    ),
    validate(adminInAppFunding),
    (req, res, next) => {
      adminController.fundUserWallet(req, res, next);
    }
  );

router
  .route('/users')
  .get(
    isAdminAuthenticated,
    restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    (req, res, next) => {
      userController.getAllUsers(req, res, next);
    }
  )
  .post(
    isAdminAuthenticated,
    restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    validate(CreateUserValidator),
    (req, res, next) => {
      adminController.createUser(req, res, next);
    }
  )
  .patch(
    isAdminAuthenticated,
    restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    validate(updateUserAccount),
    (req, res, next) => {
      adminController.updateUserRecord(req, res, next);
    }
  );

router
  .route('/lock-wallet/:userId')
  .patch(
    isAdminAuthenticated,
    restrictAdminAccessTo(
      ADMIN_ROLE.SUPER_ADMIN,
      ADMIN_ROLE.TRANSACTION,
      ADMIN_ROLE.ENGINEER
    ),
    validate(lockUserWallet),
    (req, res, next) => {
      adminController.lockUserWallet(req, res, next);
    }
  );

router
  .route('/users/search')
  .get(
    isAdminAuthenticated,
    restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    (req, res, next) => {
      userController.searchUsers(req, res, next);
    }
  );

router.get(
  '/user/:userId',
  isAdminAuthenticated,
  restrictAdminAccessTo(ADMIN_ROLE.ENGINEER, ADMIN_ROLE.SUPER_ADMIN),
  (req, res, next) => {
    userController.getUserProfile(req, res, next);
  }
)

router
  .route('/:adminId')
  .get(
    isAdminAuthenticated,
    restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    (req, res, next) => {
      adminController.getAdmin(req, res, next);
    }
  )
  .patch(
    isAdminAuthenticated,
    restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    validate(updateAdmin),
    (req, res, next) => {
      adminController.updateAdmin(req, res, next);
    }
  )

.delete(
  isAdminAuthenticated,
  restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
  (req, res, next) => {
    adminController.deleteAdmin(req, res, next);
  },
);

export default router;
