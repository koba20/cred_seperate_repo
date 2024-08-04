// PUSH TO DB src.utils.pushToDB

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";
import User from "../database/models/User.model";
import moment from "moment";
import { ACCOUNT_STATUS, GENDER, PORTFOLIO } from "../../config/constants";
import PaymentService from "../services/payment.service";
import EmailService from "../services/Email.service";
import UserService from "../services/User.service";
import KoraClient from "../services/kora/Kora.client";
import apiGatewayConfig from "../../config/config";
import VtpassClient from "../services/vtpass/Vtpass.client";
import EncryptionService from "../services/Encryption.service";
import FlutterwaveClient from "../services/flutterwave/Flutterwave.client";
const paymentService = new PaymentService(

  new FlutterwaveClient({
    pkey: apiGatewayConfig.paymentData.fpkey,
    skey: apiGatewayConfig.paymentData.fskey,
    enkey: apiGatewayConfig.paymentData.fekey,
    test: false,
  }),
  new KoraClient({
    pkey: apiGatewayConfig.paymentData.korapkey,
    skey: apiGatewayConfig.paymentData.koraskey,
    enkey: apiGatewayConfig.paymentData.koraekey,
    test: false,
  }),
  new EmailService(),
  new UserService() ,
  new VtpassClient({ skey: apiGatewayConfig.paymentData.vtpasskey }),
  new EncryptionService()
);
const pushTOdb = async () => {
  const file = fs.readFileSync(
    path.join(__dirname, "../../users.json"),
    "utf-8"
  );
  const users = JSON.parse(file);
  await Promise.all(
    users.map(async (user: any) => {
      try {
        const payload = {
          firstName: user.bioData.firstName,
          lastName: user.bioData.surname,
          middleName: user.bioData.middleName || "",
          email: user.bioData.email || "",
          phoneNumber: user.bioData.phoneNumber.startsWith("+234")
            ? user.bioData.phoneNumber
            : `+234${user.bioData.phoneNumber.replace(/^0+/, "")}`,
          portfolio: user.bioData.portfolio || PORTFOLIO.MEMBER,
          avatar: {
            url: user.bioData.profilePhoto || null,
            source: "firebase",
          },
          gender: user.bioData.gender === "Male" ? GENDER.MALE : GENDER.FEMALE,
          residentialAddress: "",
          votingAddress: user.votingAddress,
          isEmailVerified: true,
          emailVerifiedAt: moment().utc(),
          pushNotificationId: user.deviceToken || null,
          accountStatus:
            user.accountStatus === "ACTIVE"
              ? ACCOUNT_STATUS.DEACTIVATED
              : ACCOUNT_STATUS.PENDING,
          username: user.username,
          dob: user.bioData.dateOfBirth.value._seconds
            ? moment(user.bioData.dateOfBirth.value._seconds * 1000).utc()
            : moment().utc(),
        };
        const data = await User.create(payload);
        await paymentService.setupAccount<User>(data as unknown as User, {
          availableBalance: user.accountInformation.availableBalance,
          ledgerBalance: user.accountInformation.ledgerBalance,
        });
      } catch (error) {
        console.log(error);
      }
    })
  );
};

export default pushTOdb;
