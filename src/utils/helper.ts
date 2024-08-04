import moment from "moment";
import config from "../../config/config";
import { SCHEDULE, TRANSACTION_CATEGORIES } from "../../config/constants";
import { Request } from "express";

import QrCode from "qrcode";
import {
  Content,
  EmailConfig,
  From,
  Personalization,
  ReplyTo,
  Tenor,
  To,
} from "../..";
export default class HelperClass {
  static generateNextDates(day: number, duration: number): any[] {
    const result: Date[] = [];
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();



    // Check if the provided day has already passed this month
    if (today.getDate() >= day) {
      currentMonth += 1;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
      }
    }


    for (let i = 0; i < duration; i++) {
      let targetDate = new Date(currentYear, currentMonth + i, day);

      // Adjust for months that don't have the specified day (like February for 30th, 31st)
      while (targetDate.getMonth() !== (currentMonth + i) % 12) {
        console.log(targetDate.getDate());
        targetDate.setDate(targetDate.getDate() - 1);
      }

      // const formattedDate = targetDate.toISOString().split("T")[0];
      result.push(targetDate);
    }

    return result;
  }

  static getClientIP(req: Request) {
    const header = req.headers["x-forwarded-for"] as string;
    if (header) {
      const ips = header.split(",");
      return ips[0];
    }
    return req.connection.remoteAddress;
  }

  static checkChargableForTenors(tenors: Tenor[], value: number): number {
    let amount: number = value; // What is left after all the charges
    for (let tenor of tenors) {
      const remainingAmount = tenor.amount - tenor.depositedAmount;
      if (amount >= remainingAmount) {
        amount = amount - remainingAmount;
      } else {
        amount = 0;
        break;
      }
    }

    return value - amount;
  }

  static mergeAndRemoveDuplicates(
    arr1: string[] | null,
    arr2: string[] | null
  ): string[] {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
      throw new Error("Both inputs must be arrays");
    }
    const toLowerCaseAndFilter = (arr: string[] | null) =>
      arr
        ? [...new Set(arr.filter(Boolean).map((item) => item.toLowerCase()))]
        : [];

    const mergedArray = [
      ...new Set([
        ...toLowerCaseAndFilter(arr1),
        ...toLowerCaseAndFilter(arr2),
      ]),
    ];
    return mergedArray;
  }

  static prepareEmail(config: {
    email: string;
    name: string;
    message: string;
    subject: string;
  }): EmailConfig {
    const to: To = {
      email: config.email,
      name: config.name,
    };

    const personalization: Personalization = {
      to: [to],
      subject: config.subject,
    };

    const content: Content = {
      type: "text/plain",
      value: config.message,
    };

    const from: From = {
      email: "danpossible4@gmail.com",
      name: "CredX",
    };

    const replyTo: ReplyTo = {
      email: "noreply@credx.com",
      name: "CredX Support",
    };

    const email: EmailConfig = {
      personalizations: [personalization],
      content: [content],
      from: from,
      reply_to: replyTo,
    };

    return email;
  }
  static calculateProfit(amount: number, type: string) {
    let profitAmount;
    switch (type) {
      case "dstv":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      case "gotv":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      case "startimes":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      case "abuja-electric":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      case "ikeja-electric":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      case "portharcourt-electric":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      case "ibadan-electric":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      case "kano-electric":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      case "jos-electric":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      case "kaduna-electric":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      case "eko-electric":
        profitAmount = (Number(1.5) / 100) * amount;
        break;
      default:
        profitAmount = 0;
        break;
    }
    return profitAmount;
  }

  static getCategory(type: string) {
    let catergory;
    switch (type) {
      case "dstv":
        catergory = TRANSACTION_CATEGORIES.TV_SUB_PURCHASE;
        break;
      case "gotv":
        catergory = TRANSACTION_CATEGORIES.TV_SUB_PURCHASE;
        break;
      case "startimes":
        catergory = TRANSACTION_CATEGORIES.TV_SUB_PURCHASE;
        break;
      case "abuja-electric":
        catergory = TRANSACTION_CATEGORIES.BILL_PAYMENT;
        break;
      case "ikeja-electric":
        catergory = TRANSACTION_CATEGORIES.BILL_PAYMENT;
        break;
      case "portharcourt-electric":
        catergory = TRANSACTION_CATEGORIES.BILL_PAYMENT;
      case "ibadan-electric":
        catergory = TRANSACTION_CATEGORIES.BILL_PAYMENT;
        break;
      case "kano-electric":
        catergory = TRANSACTION_CATEGORIES.BILL_PAYMENT;
        break;
      case "jos-electric":
        catergory = TRANSACTION_CATEGORIES.BILL_PAYMENT;
        break;
      case "kaduna-electric":
        catergory = TRANSACTION_CATEGORIES.BILL_PAYMENT;
        break;
      case "eko-electric":
        catergory = TRANSACTION_CATEGORIES.BILL_PAYMENT;
        break;
      default:
        catergory = TRANSACTION_CATEGORIES.BILL_PAYMENT;
        break;
    }
    return catergory;
  }

  static titleCase(string: string): string {
    let sentence = string.toLowerCase().split(" ");
    sentence = sentence.filter((str) => str.trim().length > 0);
    for (let i = 0; i < sentence.length; i++) {
      sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence.join(" ");
  }

  static upperCase(string: string): string {
    let sentence = string.toUpperCase().split(" ");
    sentence = sentence.filter((str) => str.trim().length > 0);
    return sentence.join(" ");
  }

  static capitalCase(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  // Generate Random 11 digits code
  static generateRandomBVN(length = 11): string {
    let result = "";
    const characters = "0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  static generateRandomChar(length = 32, type = "alpha-num"): string {
    // "num", "upper", "lower", "upper-num", "lower-num", "alpha-num"
    let result = "";
    let characters =
      "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    if (type === "num") characters = "0123456789";
    if (type === "upper-num")
      characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789";
    if (type === "lower-num")
      characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    if (type === "upper") characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (type === "lower") characters = "abcdefghijklmnopqrstuvwxyz";
    if (type === "alpha")
      characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    const charactersLength = characters.length;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  static userNameValidator(string: string) {
    /**
     * Ensure it only starts with alphabets, can have numbers and can only contain '-', '_' special characters.
     */
    const strongRegex = new RegExp(/^[ A-Za-z0-9_-]*$/);
    if (!strongRegex.test(string)) {
      throw new Error(
        "Invalid character in username. Only hiphen (-) and underscore (_) are allowed"
      );
    }
  }
  static removeUnwantedProperties(object: unknown, properties: string[]) {
    let newObject: { [key: string]: string } = {};
    if (typeof object === "object" && object !== null) {
      newObject = { ...object };
      properties.forEach((property) => {
        delete newObject[property];
      });
    }
    return newObject;
  }

  static calculateSponsoredItemCost(type: string) {
    let amount: string;
    let startDate: Date;
    let endDate: Date;
    let promotionType: string;
    switch (type) {
      case "one_week":
        amount = config.paymentProcessing.oneWeekPromotionCost;
        startDate = moment().utc().startOf("day").toDate();
        endDate = moment().utc().add(7, "days").startOf("day").toDate();
        promotionType = "one_week";
        break;
      case "two_weeks":
        amount = config.paymentProcessing.twoWeekPromotionCost;
        startDate = moment().utc().startOf("day").toDate();
        endDate = moment().utc().add(14, "days").startOf("day").toDate();
        promotionType = "two_weeks";
        break;
      case "three_weeks":
        amount = config.paymentProcessing.threeWeekPromotionCost;
        startDate = moment().utc().startOf("day").toDate();
        endDate = moment().utc().add(21, "days").startOf("day").toDate();
        promotionType = "three_weeks";
        break;
      case "one month":
        amount = config.paymentProcessing.oneMonthPromotionCost;
        startDate = moment().utc().startOf("day").toDate();
        endDate = moment().utc().add(1, "months").startOf("day").toDate();
        promotionType = "one_month";
        break;
      default:
        amount = "0";
        break;
    }
    return { amount, startDate, endDate, promotionType };
  }

  static calculateSchedulePeriod(duration: string): {
    nextChargeDate: Date;
  } {
    let nextChargeDate: Date;
    switch (duration) {
      case SCHEDULE.WEEKLY:
        nextChargeDate = moment().utc().add(1, "week").startOf("day").toDate();
        break;
      case SCHEDULE.BI_WEEKLY:
        nextChargeDate = moment().utc().add(2, "weeks").startOf("day").toDate();
        break;
      case SCHEDULE.MONTHLY:
        nextChargeDate = moment()
          .utc()
          .add(1, "months")
          .startOf("day")
          .toDate();
        break;
      case SCHEDULE.QUARTERLY:
        nextChargeDate = moment()
          .utc()
          .add(3, "months")
          .startOf("day")
          .toDate();
        break;
    }
    return { nextChargeDate };
  }

  static async generateQrCode(body: { [key: string]: string } | string) {
    const data = JSON.stringify(body);
    const qrCode = await QrCode.toDataURL(data);
    return qrCode;
  }

  static calculateAmountPercentate(args: {
    amount: number;
    percentage: number;
  }) {
    return (args.amount * args.percentage) / 100;
  }

  static isIdentifierEmailOrPhone(input: string) {
    // Regular expressions to check for email and phone number patterns
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phonePattern = /^[0-9]{15}$/; // Change this pattern to match the phone number format you expect
    return emailPattern.test(input)
      ? { isEmail: true }
      : phonePattern.test(input)
      ? { isPhoneNumber: true }
      : null;
  }
}
