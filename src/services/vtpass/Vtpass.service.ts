import VtpassClient from "./Vtpass.client";

export default class Vtpass {
  skey: string;
  test: boolean;

  setSecretkey(skey: string) {
    this.skey = skey;
  }

  setTestMode(test: boolean) {
    this.test = test;
  }
  

  build(){
    return new VtpassClient(this);
  }
}
