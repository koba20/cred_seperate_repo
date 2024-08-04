import FlutterwaveClient from "./Flutterwave.client";

export default class Flutterwave {
  pkey: string;
  skey: string;
  enkey: string;
  test: boolean;

  setSecretkey(skey: string) {
    this.skey = skey;
  }

  setPublickey(pkey: string) {
    this.pkey = pkey;
  }

  setEncriptionkey(enkey: string) {
    this.enkey = enkey;
  }

  setTestMode(test: boolean) {
    this.test = test;
  }
  

  build(){
    return new FlutterwaveClient(this);
  }
}
