import axios, { AxiosInstance } from "axios";
import SMS from "./sms";
import VERIFICATION from "./otp";
import { baseUrl } from "./endpoints";

import mConfig from "../../../config/config";
import EMAIL from "./email";

export default class SendChamp {
  private axiosInstance: AxiosInstance;
  private axiosInstance1: AxiosInstance;
  public sms: SMS = new SMS();
  public verification: VERIFICATION = new VERIFICATION();
  public email: EMAIL = new EMAIL();

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: baseUrl["SENDCHAMP"],

      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${mConfig.notifier.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    this.axiosInstance1 = axios.create({
      baseURL: baseUrl["SENDGRID"],
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${mConfig.notifier.twilloKey}`,
        "Content-Type": "application/json",
      },
    });

    // Initialize axios instance of subclasses
    SMS.axiosInstance = this.axiosInstance;
    VERIFICATION.axiosInstance = this.axiosInstance;
    EMAIL.axiosInstance = this.axiosInstance1;
  }
}
