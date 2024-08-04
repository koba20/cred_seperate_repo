import { FlutterResponse } from "../../..";
import config from "../../../config/config";
import EncryptionService from "../Encryption.service";
import FlutterwaveUtil from "./Flutterwave.functions";

export default class FlutterwaveClient extends FlutterwaveUtil {
  private encrypter: EncryptionService = new EncryptionService();

  constructor(build: {
    pkey: string;
    skey: string;
    enkey: string;
    test: boolean;
  }) {
    super(build);
  }

  async chargeCard(_config: {
    card_number: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
    currency: "NGN";
    amount: string;
    fullname: string;
    email: string;
    tx_ref: string;
    redirect_url: string;
    authorization: {
      mode: string;
      pin: string;
    };
  }) {
    try {
      const cypher = this.encrypter.encryptPayload(
        config.paymentData.fekey,
        _config
      );
      const result = await this.postRequest<any, FlutterResponse>(
        this.buildHeader(),
        { client: cypher },
        "/charges?type=card"
      );

      console.log(result);
      return this.checkError<FlutterResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async verifyCharge(transaction: {
    otp: string;
    flw_ref: string;
    type: string;
  }) {
    try {
      const result = await this.postRequest<any, FlutterResponse>(
        this.buildHeader(),
        transaction,
        "/validate-charge"
      );

      console.log(result);
      return this.checkError<FlutterResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async verifyTransaction(transaction: string) {
    try {
      const result = await this.getRequest<FlutterResponse>(
        this.buildHeader(),
        `/transactions/${transaction}/verify`
      );
      return this.checkError<FlutterResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
