import apiGatewayConfig from "../../../../config/config";
import AdminService from "../../../services/Admin.service";
import AuthService from "../../../services/Auth.service";
import EmailService from "../../../services/Email.service";
import EncryptionService from "../../../services/Encryption.service";
import TokenService from "../../../services/Token.service";
import UserService from "../../../services/User.service";
import FlutterwaveClient from "../../../services/flutterwave/Flutterwave.client";
import KoraClient from "../../../services/kora/Kora.client";
import PaymentService from "../../../services/payment.service";
import VtpassClient from "../../../services/vtpass/Vtpass.client";
import AdminAuth from "./admin.auth";
import UserAuth from "./user.auth";

export const userAuth = new UserAuth(
  new AuthService(
    new EncryptionService(),
    new TokenService(),
    new EmailService()
  ),
  new UserService(),
  new EncryptionService()
);

export const adminAuth = new AdminAuth(
  new AuthService(
    new EncryptionService(),
    new TokenService(),
    new EmailService()
  ),
  new AdminService(),
  new EncryptionService(),
  new PaymentService(
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
    new UserService(),
    new VtpassClient({ skey: apiGatewayConfig.paymentData.vtpasskey }),
    new EncryptionService()
  )
);
