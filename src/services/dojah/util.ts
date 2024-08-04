import fetch from 'node-fetch';
import { BaseResponse } from '../../../index.d';
import { baseUrl } from './endpoints';
// import axios from 'axios';

export interface ObjT {
  [key: string]: string;
}

export default class DojahUtil {
  appId: string;
  secretKey: string;
  production: boolean;

  constructor(build: {
    appId: string;
    secretKey: string;
    production: boolean;
  }) {
    this.secretKey = build.secretKey;
    this.appId = build.appId;
    this.production = build.production;
  }

  getBaseUrl(endpoint: string) {
    return this.production
      ? `${baseUrl.PRODUCTION}/${endpoint}`
      : `${baseUrl.SANDBOX}/${endpoint}`;
  }

  checkError<T extends BaseResponse>(response: T) {
    if (response.status === 'error') {
      return {
        status: true,
        ...response,
      };
    } else {
      return {
        status: false,
        ...response,
      };
    }
  }

  buildHeader(): ObjT {
    return {
      'Content-type': 'application/json',
      Accept: 'application/json',
      Authorization: `${this.secretKey}`,
      AppId: this.appId,
    };
  }

  async postRequest<T, K>(headers: ObjT, jsonData: T, url: string): Promise<K> {
    const data = await fetch(url, {
      method: 'POST',
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

  async getRequest<T>(headers: ObjT, url: string): Promise<T> {
    const data = await fetch(url, {
      method: 'GET',
      headers,
      timeout: 10000,
    });
    const respStr = await data.text();
    let resp;
    try {
      resp = JSON.parse(respStr);
      String(data.status).startsWith('2')
        ? Object.assign(resp, {
            message: 'Drivers license validated successfully',
            status: 'success',
          })
        : Object.assign(resp, { status: 'error', message: resp?.error });
    } catch (error) {
      resp = respStr;
    }

    return resp;
  }
}
