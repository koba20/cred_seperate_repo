import { Router } from "express";
import { isAdminAuthenticated } from "../../middlewares/auth.middleware";
import { organizationController } from "../../controllers/controllers.module";
import validate from "../../middlewares/validate";
import {
  createOrganization,
  updateOrganization,
} from "../../../validators/Organization.validation";
import { ADMIN_ROLE } from "../../../../config/constants";
import { restrictAdminAccessTo } from "../../middlewares/role.middleware";

const router = Router();

router
  .route("/create")
  .post(
    isAdminAuthenticated,
    validate(createOrganization),
    (req, res, next) => {
      organizationController.createOrganization(req, res, next);
    }
  );

router.route("/").get((req, res, next) => {
  organizationController.getOrganizations(req, res, next);
});

router
  .route("/verify/:token")
  .post((req, res, next) => {
    organizationController.verifyUserFromOrg(req, res, next);
  })
  .get((req, res, next) => {
    organizationController.getUserFromVerificationToken(req, res, next);
  });

router
  .route("/:id")
  .get((req, res, next) => {
    console.log("----");
    organizationController.getOrganization(req, res, next);
  })
  .patch(
    isAdminAuthenticated,
    restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    validate(updateOrganization),
    (req, res, next) => {
      organizationController.updateOrganization(req, res, next);
    }
  )
  .delete(
    isAdminAuthenticated,
    restrictAdminAccessTo(ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ENGINEER),
    (req, res, next) => {
      organizationController.deleteOrganization(req, res, next);
    }
  );

export default router;
