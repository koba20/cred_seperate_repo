import { KoraResponse } from "../../..";

export interface ObjT {
  [key: string]: string;
}

export default class KoraUtils {
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
    const liveBusinessServer = "https://api.korapay.com/merchant/api/v1";
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

  // CHECK_HERE: ERROR HANDLING FOR KORA
  checkError<T extends KoraResponse>(response: T): T {
    return response;
  }

  buildHeader(isPublicKey: boolean): ObjT {
    return {
      "Content-type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${isPublicKey ? this.pkey : this.skey}`,
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

    console.log(headers);
    console.log(resp);
    return resp;
  }

  async getRequest<K>(headers: ObjT, url: string): Promise<K> {
    console.log(headers);
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
