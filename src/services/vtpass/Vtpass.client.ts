import { VtpassResponse } from "../../..";
import VtpassUtilFunction from "./VtpassUtilFunction";

export default class VtpassClient extends VtpassUtilFunction {
  constructor(build: { skey: string; test?: boolean }) {
    super(build);
  }

  async buyAirtime(_config: any) {
    try {
      const result = await this.postRequest<typeof _config, VtpassResponse>(
        this.buildHeader(),
        { ..._config, request_id: this.generateCode() },
        "/pay"
      );
      return this.checkError<VtpassResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async purchaseUtility(_config: any) {
    try {
      const result = await this.postRequest<typeof _config, VtpassResponse>(
        this.buildHeader(),
        { ..._config, request_id: this.generateCode() },
        "/pay"
      );
      return this.checkError<VtpassResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async validateCustomerReference(_config: any) {
    try {
      const result = await this.postRequest<typeof _config, VtpassResponse>(
        this.buildHeader(),
        { ..._config, request_id: this.generateCode() },
        "/merchant-verify"
      );
      return this.checkError<VtpassResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getVariations(_config: any) {
    try {
      const result = await this.getRequest<VtpassResponse>(
        this.buildHeader(),
        `/service-variations?serviceID=${_config.serviceID}`
      );
      return this.checkError<VtpassResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getUtilitiesProviders() {
    try {
      const result = [
        {
          name: "IKEDC",
          code: "ikeja-electric",
          type: "prepaid",
          min: 600,
          max: 1000000,
          image:
            "https://www.vtpass.com/resources/products/200X200/Ikeja-Electric-Payment-PHCN.jpg",
        },
        {
          name: "EKEDC",
          code: "eko-electric",

          type: "prepaid",
          min: 600,
          max: 1000000,
          image:
            "https://www.vtpass.com/resources/products/200X200/Eko-Electric-Payment-PHCN.jpg",
        },
        {
          name: "KEDCO",
          code: "kano-electric",

          type: "prepaid",
          min: 600,
          max: 1000000,
          image:
            "https://www.vtpass.com/resources/products/200X200/Kano-Electric.jpg",
        },
        {
          name: "PHDC",
          code: "portharcourt-electric",

          type: "prepaid",
          min: 600,
          max: 1000000,
          image:
            "https://www.vtpass.com/resources/products/200X200/Port-Harcourt-Electric.jpg",
        },

        {
          name: "JED",
          code: "jos-electric",

          type: "prepaid",
          min: 600,
          max: 1000000,
          image:
            "https://www.vtpass.com/resources/products/200X200/Jos-Electric-JED.jpg",
        },

        {
          name: "IBEDC",
          code: "ibadan-electric",

          type: "prepaid",
          min: 600,
          max: 1000000,
          image:
            "https://www.vtpass.com/resources/products/200X200/IBEDC-Ibadan-Electricity-Distribution-Company.jpg",
        },

        {
          name: "KAEDCO",
          code: "kaduna-electric",

          type: "prepaid",
          min: 600,
          max: 1000000,
          image:
            "https://www.vtpass.com/resources/products/200X200/Kaduna-Electric-KAEDCO.jpg",
        },

        {
          name: "AEDC",
          code: "abuja-electric",

          type: "prepaid",
          min: 600,
          max: 1000000,
          image:
            "https://www.vtpass.com/resources/products/200X200/Abuja-Electric.jpg",
        },
      ];
      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getTransferFee(amount: number) {
    try {
      const result = await this.getRequest<VtpassResponse>(
        this.buildHeader(),
        `/transfers/fee?amount=${amount}&currency=NGN`
      );
      return this.checkError<VtpassResponse>(result);
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
