import Dojah from './sdk';

export default class DojahClient {
  appId: string;
  secretKey: string;
  production: boolean;

  setAppId(appId: string) {
    this.appId = appId;
    return this;
  }

  setApiKey(secretKey: string) {
    this.secretKey = secretKey;
    return this;
  }

  setProduction(production: boolean) {
    this.production = production;
    return this;
  }

  build() {
    return new Dojah(this);
  }
}
