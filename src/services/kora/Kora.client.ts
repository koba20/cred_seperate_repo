import { KoraResponse } from "../../..";
import KoraUtils from "./KoraUtils";

export default class KoraClient extends KoraUtils {
  constructor(build: {
    pkey: string;
    skey: string;
    enkey: string;
    test: boolean;
  }) {
    super(build);
  }

  async createAccount(_config: {
    account_name: string;
    account_reference: string;
    permanent: boolean;
    bank_code: string;
    customer: {
      name: string;
      email: string;
    };
  }) {
    try {
      const result = await this.postRequest<typeof _config, KoraResponse>(
        this.buildHeader(false),
        _config,
        "/virtual-bank-account"
      );

      if (!result.status) throw new Error(result.message);
      const response = this.checkError<KoraResponse>(result);
      return response;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async checkAccount(_config: any) {
    try {
      const result = await this.postRequest<typeof _config, KoraResponse>(
        this.buildHeader(false),
        _config,
        "/misc/banks/resolve"
      );
      return this.checkError<KoraResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getBanks() {
    try {
      const result = await this.getRequest<KoraResponse>(
        this.buildHeader(true),
        "/misc/banks?countryCode=NG"
      );

      console.log(result);
      return this.checkError<KoraResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getTransferFee(amount: number) {
    try {
      const result = await this.getRequest<KoraResponse>(
        this.buildHeader(true),
        `/transfers/fee?amount=${amount}&currency=NGN`
      );
      return this.checkError<KoraResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async withdrawFunds(_config: any) {
    try {
      const result = await this.postRequest<typeof _config, KoraResponse>(
        this.buildHeader(false),
        _config,
        "/charges/bank-transfer"
      );
      return this.checkError<KoraResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
