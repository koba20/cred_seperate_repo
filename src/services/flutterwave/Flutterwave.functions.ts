import config from "../../../config/config";
import { FlutterResponse } from "../../..";

export interface ObjT {
  [key: string]: string;
}

export default class FlutterwaveUtil {
  pkey: string;
  skey: string;
  enkey: string;
  test: boolean;
  constructor(build: {
    skey: string;
    pkey: string;
    enkey: string;
    test: boolean;
  }) {
    this.skey = build.skey;
    this.pkey = build.pkey;
    this.enkey = build.enkey;
    this.test = build.test;
  }

  getBaseUrl(): string {
    const liveBusinessServer = config.paymentData.fbaseUrl;
    return liveBusinessServer;
  }

  filterOptionalFields(obj: ObjT): ObjT {
    const data = Object.keys(obj)
      .filter((k) => obj[k] !== null)
      .reduce(
        (a, k) => ({
          ...a,
          [k]: obj[k],
        }),
        {}
      );
    return data;
  }

  // CHECK_HERE: ERROR HANDLING FOR FLUTTERWAVE
  checkError<T extends FlutterResponse>(response: T): T {
    const { status } = response;

    if (status != "success") {
       throw new Error(response.message)
    } else {
      return {
        ...response,
      };
    }
  }

  buildHeader(): ObjT {
    return {
      "Content-type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${config.paymentData.fskey}`,
    };
  }

  async postRequest<T, K>(headers: ObjT, jsonData: T, url: string): Promise<K> {
    const data = await fetch(`${this.getBaseUrl()}${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(jsonData),
    });
    const respStr = await data.text();
    let resp;

    try {
      resp = JSON.parse(respStr);
    } catch (error) {
      resp = respStr;
    }
    return resp;
  }

  async getRequest<K>(headers: ObjT, url: string): Promise<K> {
    const data = await fetch(`${this.getBaseUrl()}${url}`, {
      method: "GET",
      headers,
    });

    const respStr = await data.text();
    let resp;
    try {
      resp = JSON.parse(respStr);
    } catch (error) {
      resp = respStr;
    }

    return resp;
  }
}
