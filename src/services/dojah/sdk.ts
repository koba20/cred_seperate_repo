/* eslint-disable @typescript-eslint/no-explicit-any */

import { ValidateBVNResponse, ValidateNINResponse } from "../../../index";
import endpoints from "./endpoints";
import DojahUtil from "./util";



export default class Dojah extends DojahUtil {
  constructor(build: {
    appId: string;
    secretKey: string;
    production: boolean;
  }) {
    super(build);
  }

  async validateNIN(nin: string): Promise<ValidateNINResponse> {
    try {
      const response = await this.getRequest<ValidateNINResponse>(
        this.buildHeader(),
        this.getBaseUrl(`${endpoints.NIN}?nin=${nin}`)
      );

      const checkError = this.checkError<ValidateNINResponse>(response);

      if (checkError["status"]) {
        return checkError["entity"];
      } else {
        throw new Error("Could not validate bvn");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }

  async validateBVN(bvn: string): Promise<ValidateBVNResponse> {
    try {
      const response = await this.getRequest<ValidateBVNResponse>(
        this.buildHeader(),
        this.getBaseUrl(`${endpoints.BVN}?bvn=${bvn}`)
      );

      const checkError = this.checkError<ValidateBVNResponse>(response);
      if (checkError["status"]) {
        return checkError["entity"];
      } else {
        throw new Error("Could not validate bvn");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }
}
