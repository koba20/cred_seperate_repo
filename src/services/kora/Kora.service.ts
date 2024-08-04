import FlutterwaveClient from "./Kora.client";

export default class Kora {
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
