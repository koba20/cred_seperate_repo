const baseUrl: {
  PRODUCTION: string;
  SANDBOX: string;
} = Object.freeze({
  PRODUCTION: "https://api.dojah.io/api/v1",
  SANDBOX: "https://sandbox.dojah.io/api/v1",
});

const endpoints = Object.freeze({
  BVN: "kyc/bvn/full",
  NIN: "kyc/nin",
});

export default endpoints;
export { baseUrl };
