import { VtpassResponse } from "../../..";

export interface ObjT {
  [key: string]: string;
}

export default class VtpassUtilFunction {
  skey: string;
  test?: boolean;
  constructor(build: { skey: string; test?: boolean }) {
    this.skey = build.skey;
    this.test = build.test;
  }

  getBaseUrl(): string {
    const liveBusinessServer = "https://api-service.vtpass.com/api";
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

  checkError<T extends VtpassResponse>(response: T): T {
    // const { status } = response;
    return {
      ...response,
    };

    // if (status != "success") {
    //   return {
    //     ...response,
    //   };
    // } else {
    //   return {
    //     ...response,
    //   };
    // }
  }

  generateCode(): string {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const generateId = (): string => {
      let randomString = "";
      for (let i = 0; i < 7; i++) {
        randomString += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return randomString;
    };

    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const date = now.getDate().toString().padStart(2, "0");
    const hour = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");

    const ref = generateId();
    return `${now.getFullYear()}${month}${date}${hour}${minutes}${ref}`;
  }

  buildHeader(): ObjT {
    return {
      "Content-type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${this.skey}`,
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

    console.log(resp);
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
