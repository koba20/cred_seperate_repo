import { AxiosInstance } from "axios";
import endpoints from "./endpoints";
import { EmailConfig } from "../../..";

export default class EMAIL {
  static axiosInstance: AxiosInstance;

  sendGrid = async (config: EmailConfig): Promise<boolean> => {
    try {
      await EMAIL.axiosInstance({
        url: endpoints.SEND_EMAIL_SENDGRID,
        method: "POST",
        data: config,
      });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };
}
