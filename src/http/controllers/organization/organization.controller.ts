import { NextFunction, Response } from "express";
import EmailService from "../../../services/Email.service";
import UserService from "../../../services/User.service";
import { RequestType } from "../../middlewares/auth.middleware";
import OrganizationService from "../../../services/Organization.service";
import HelperClass from "../../../utils/helper";
import {
  ACCOUNT_STATUS,
  ELIGIBILITY_STATUS,
  WORK_STATUS,
  WS_EVENT,
} from "../../../../config/constants";
import httpStatus from "http-status";
import AppException from "../../../exceptions/AppException";
import pick from "../../../utils/pick";
import moment from "moment";
import { deleteFile, uploadBase64File } from "../../../services/File.service";
import { User, Work } from "../../../..";
import WorkService from "../../../services/Work.service";
import EligibilityService from "../../../services/Eligibility.service";
import WS from "../../../utils/ws.config";

export default class OrganizationController {
  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly organizationService: OrganizationService,
    private readonly workService: WorkService,
    private readonly eligibilityService: EligibilityService
  ) {}

  async getUserFromVerificationToken(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = req.params.token;
      const work: Work = await this.workService.getWorkByDetails({
        token: token,
      });

      if (!work) {
        throw new Error("Work request not found");
      }

      const user: User = await this.userService.getUserById(
        work.user as string,
        true,
        "work"
      );

      if (!user) throw new Error("User not found");
      if (work.expiry < moment().utc().startOf("day").toDate())
        throw new Error(`Oops!, your token has expired`);

      const organization = await this.organizationService.getOrganizationById(
        work.organization as string
      );

      res.status(httpStatus.CREATED).json({
        status: "success",
        user,
        organization,
        work,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async verifyUserFromOrg(req: RequestType, res: Response, next: NextFunction) {
    try {
      const token = req.params.token;

      const work: Work = await this.workService.getWorkByDetails({
        token: token,
      });

      if (!work) {
        throw new Error("Work request not found");
      }

      const user: User = await this.userService.getUserById(
        work.user as string
      );

      if (!user) throw new Error("User not found");
      if (user.accountStatus.status != ACCOUNT_STATUS.ACTIVATED)
        throw new Error("User account is not activated");

      if (work.expiry < moment().utc().startOf("day").toDate())
        throw new Error(`Oops!, your token has expired`);

      const organization = await this.organizationService.getOrganizationById(
        work.organization as string
      );

      const workHistory = await this.eligibilityService.getEligibilityByDetails(
        {
          user: work.user as string,
          work: work._id,
        }
      );

      if (workHistory)
        throw new Error("Already has a work history with this Company");

      if (!organization) throw new Error("Organization not found");
      await this.workService.updateWorkById(work._id, {
        balance: {
          line: work.salary,
          trench: 0,
          exposure: work.salary,
        },
        status: {
          status: WORK_STATUS.ACTIVE,
          reason: "Work approved BY HR",
        },
        token: null,
        expiry: null,
      });

      WS.instance.emitEventToClient(
        user._id as string,
        WS_EVENT.ORGNIZATION_RESPONSE,
        {
          status: "APPROVED",
          eligibilty: {
            line: work.salary,
            trench: 0,
            exposure: work.salary,
          },
        }
      );

      await this.userService.updateUserById(work.user as string, {
        work: work._id,
        requestToJoin: null,
      });

      this.emailService.notifyStationUsersOfNotification(
        user.email,
        `${user.firstName}`,
        `Account created successfully been approved by the HR of ${organization.name}`
      );

      await this.eligibilityService.createEligibility({
        user: work.user as string,
        work: work._id,
        months: 4,
        amount: work.salary,
        status: {
          reason: `You are eligible for a loan of ${work.salary}`,
          status: ELIGIBILITY_STATUS.ELIGIBLE,
        },
      });

      res.status(httpStatus.CREATED).json({
        status: "success",
        message: "User has been verified. Thank you.",
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }
  async createOrganization(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      // fetch based on org email
      const emailTaken = await this.organizationService.getOrganizationDetails({
        email: req.body.email,
      });

      // fetch based on hr Email

      const hrEmailTaken =
        await this.organizationService.getOrganizationDetails({
          "hrInfo.email": req.body.hr.email,
        });

      // fetch based on organization
      const phoneNumberTaken =
        await this.organizationService.getOrganizationDetails({
          phoneNumber: req.body.phoneNumber,
        });

      // check of ORG. email is
      if (emailTaken) throw new Error(`Oops!, ${emailTaken.email} is taken`);

      // check HR. email
      if (hrEmailTaken)
        throw new Error(
          `Oops!, ${hrEmailTaken.hrInfo.email} is taken or another Org.`
        );

      // Check ORG. phone number
      if (phoneNumberTaken)
        throw new Error(`Oops!, ${phoneNumberTaken.phoneNumber} is taken`);

      req.body.name = HelperClass.titleCase(req.body.name);
      req.body.phoneNumber = req.body.phoneNumber.startsWith("+234")
        ? req.body.phoneNumber
        : `+234${req.body.phoneNumber.replace(/^0+/, "")}`;

      req.body.createdBy = req.admin.id;
      req.body.accountStatus = {
        status: ACCOUNT_STATUS.ACTIVATED,
        reason: "Account activated",
      };

      req.body.hrInfo = {
        firstName: req.body.hr.firstName,
        lastName: req.body.hr.lastName,
        middleName: req.body.hr.middleName,
        email: req.body.hr.email,
      };

      req.body.coperateInfo = {
        rcNumber: req.body.coperate.rcNumber,
      };

      req.body.repaymentInfo = req.body.repaymentInfo;



      delete req.body.hr;
      delete req.body.coperate;

      const data = await this.organizationService.createOrganization(req.body);
      await this.emailService.notifyStationUsersOfNotification(
        data.email,
        `${data.name}`,
        `Account created successfully, login credentials has been sent to ${data.email} and ${data.phoneNumber}`
      );

      res.status(httpStatus.CREATED).json({
        status: "success",
        organization: data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getOrganizations(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = pick(req.query, ["accountStatus"]);
      const options = pick(req.query, ["orderBy", "page", "limit", "populate"]);
      if (req.query.search) {
        const search = {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        };
        Object.assign(filter, search);
      }
      const data = await this.organizationService.getAllOrganization(
        filter,
        options
      );
      res.status(httpStatus.OK).json({
        status: "success",
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getOrganization(req: RequestType, res: Response, next: NextFunction) {
    try {
      const data = await this.organizationService.getOrganizationById(
        req.params.id
      );
      if (!data) throw new Error("Organization not found");
      res.status(httpStatus.OK).json({
        status: "success",
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }
  async deleteOrganization(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await this.organizationService.getOrganizationById(
        req.params.id
      );
      if (!data) throw new Error("Organization not found");
      await this.organizationService.deleteOrganizationById(req.params.id);

      res.status(httpStatus.OK).json({
        status: "success",
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async updateOrganization(
    req: RequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      req.body.updatedBy = req.admin.id;
      const organization = await this.organizationService.getOrganizationById(
        req.params.id
      );
      if (!organization) throw Error("Organization not found");

      if (organization.logo?.url) {
        if (organization.logo.public_id) {
          await deleteFile(organization.logo.public_id);
        }
        const publicId = HelperClass.generateRandomChar(12);
        const photo = await uploadBase64File(
          req.body.logo,
          "organiation_avatar",
          publicId
        );

        req.body.logo = { url: photo.secure_url, public_id: publicId };
      }
      req.body.updatedBy = req.admin.id;
      req.body.updatedAt = moment().utc().toDate();
      const data = await this.organizationService.updateOrganizationById(
        req.params.id,
        req.body
      );
      if (!data) throw new Error("Organization not found");
      res.status(httpStatus.OK).json({
        status: "success",
        data,
      });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        return next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }
}
