import dotenv from "dotenv";
dotenv.config();

import * as Yup from "yup";

const envSchema = Yup.object()
  .shape({
    NODE_ENV: Yup.string()
      .required()
      .oneOf(["development", "production", "test", "staging"]),
    PORT: Yup.string().default("8080").required(),
    ENVIRONMENT: Yup.string().default("staging"),
    FRONTEND_APP_URL: Yup.string().label("Frontend APP URL"),

    API_DOMAIN: Yup.string().label("API Domain"),
    ENFORCE_SSL: Yup.string()
      .default("false")
      .label("This is to determine whether to use HTTP or HTTPS"),
    USE_PORT: Yup.string().default("false").label("Use port"),
    DATABASE_URL: Yup.string().label("MONGO Database URL"),
    APP_NAME: Yup.string().required().label("App Name").default("AGSAAP"),
    JWT_ACCESS_TOKEN_EXPIRES: Yup.string()
      .default("1h")
      .label("JWT Access Token Expires")
      .required(),
    JWT_REFRESH_TOKEN_EXPIRES: Yup.string()
      .default("24h")
      .label("JWT Refresh Token Expires")
      .required(),

    MAIL_FROM: Yup.string().required().label("Mail From").required(),
    MAIL_USER: Yup.string().required().label("Mail User").required(),
    MAIL_PASSWORD: Yup.string().required().label("Mail Password").required(),
    MAIL_HOST: Yup.string().required().label("Mail Host").required(),
    MAIL_PORT: Yup.string().required().label("Mail Port").required(),

    REDIS_HOST: Yup.string().required().label("Redis Host Missing").required(),
    REDIS_PORT: Yup.string().required().label("Redis Port Missing").required(),
    REDIS_URL: Yup.string().required().label("Redis URL Missing").required(),

    CLOUDINARY_NAME: Yup.string().label("Cloudinary Name").required(),
    CLOUDINARY_API_KEY: Yup.string().label("Cloudinary API Key").required(),
    CLOUDINARY_API_SECRET: Yup.string()
      .label("Cloudinary API Secret")
      .required(),
    NOTIFIER_KEY: Yup.string().label("Notifier key required").required(),
    CRON_SCHEDULE_DELETE_USER_ACCOUNT_IF_NOT_VERIFIED: Yup.string().label(
      "Cron Schedule Delete User Account If Not Verified"
    ),

    PAGA_AUTHORIZATION_KEY: Yup.string().label("PAGA Authorization Key"),
    STORE_PAYMENT_PROCESSING_FEE: Yup.string()
      .label("Store payment processing fees")
      .default("1.4"),
    STORE_PAYMENT_CHARGE: Yup.string()
      .label("Store payment charge")
      .default("3"),
    WITHDRAWAL_PROCESSING_COST: Yup.string()
      .label("Store withdrawal processing cost")
      .default("53.5"),
    WITHDRAWAL_CHARGE: Yup.string()
      .label("Store withdrawal charge")
      .default("60"),
    DEPOSIT_CHARGE: Yup.string().label("Store deposit charge").default("0.75"),
    INVOICE_PROCESSING_COST: Yup.string()
      .label("Store invoice processing cost")
      .default("1.4"),
    INVOICE_PROCESSING_CHARGE: Yup.string()
      .label("Store invoice processing charge")
      .default("3"),
    SKILL_UP_PROCESSING_COST: Yup.string()
      .label("Store invoice processing cost")
      .default("1.5"),
    SKILL_UP_PROCESSING_CHARGE: Yup.string()
      .label("Store invoice processing charge")
      .default("3"),
    SEND_CHAMP_PUB_KEY: Yup.string().label("Send Champ Public Key").required(),
    SEND_CHAMP_BASE_URL: Yup.string().label("Send Champ Base URL").required(),
    SEND_CHAMP_SENDER_ID: Yup.string().label("Send Champ Sender ID").required(),
    SHOP_PURCHASE_FEE: Yup.string().label("Shop Fees").default("20_000"),
    SEND_CHAMP_MODE: Yup.mixed()
      .label("Send Champ Mode")
      .required()
      .oneOf<"test" | "live" | "local-simulator">([
        "test",
        "live",
        "local-simulator",
      ]),
    ONE_WEEK_PROMOTION_COST: Yup.string()
      .label("Product Item Promotion For a week")
      .default("5_000"),
    TWO_WEEK_PROMOTION_COST: Yup.string()
      .label("Product Item Promotion For 2 weeks")
      .default("10_000"),
    THREE_WEEK_PROMOTION_COST: Yup.string()
      .label("Product Item Promotion For 3 weeks")
      .default("15_000"),
    ONE_MONTH_PROMOTION_COST: Yup.string()
      .label("Product Item Promotion For a month")
      .default("20_000"),
    SLWP_BASE_URL: Yup.string().label("SLWP Base URL").required(),

    DOJAH_APP_ID: Yup.string().label("Dojah App ID").required(),
    DOJAH_PRIVATE_KEY: Yup.string().label("Dojah Private Key").required(),
    DOJAH_PRODUCTION: Yup.string().required(),
    K_SKEY: Yup.string().required(),
    K_PKEY: Yup.string().required(),
    K_EKEY: Yup.string().required(),

    F_SKEY: Yup.string().required(),
    F_PKEY: Yup.string().required(),
    F_EKEY: Yup.string().required(),
    F_BASE_URL: Yup.string().required(),


    TWILLON_KEY: Yup.string().required(),
    VTPASS_KEY: Yup.string().required(),
  })
  .unknown();

let envVars: Yup.InferType<typeof envSchema>;
try {
  envVars = envSchema.validateSync(process.env, {
    strict: true,
    abortEarly: true,
    stripUnknown: true,
  });
} catch (error) {
  if (error instanceof Error) {
    throw new Error(`Config validation error: ${error.message}`);
  } else {
    throw error;
  }
}

export default {
  env: envVars.NODE_ENV,
  FRONTEND_APP_URL: envVars.FRONTEND_APP_URL,
  environment: envVars.ENVIRONMENT,
  DATABASE_URL: envVars.DATABASE_URL,
  port: envVars.PORT,
  appName: envVars.APP_NAME,
  jwtAccessTokenExpiration: envVars.JWT_ACCESS_TOKEN_EXPIRES,
  jwtRefreshTokenExpiration: envVars.JWT_REFRESH_TOKEN_EXPIRES,
  name: envVars.APP_NAME,
  from: envVars.MAIL_FROM,
  MAIL_HOST: envVars.MAIL_HOST,
  MAIL_PASSWORD: envVars.MAIL_PASSWORD,
  MAIL_USER: envVars.MAIL_USER,
  MAIL_PORT: envVars.MAIL_PORT,
  baseApiUrl: `${envVars.ENFORCE_SSL ? "https" : "http"}://${
    envVars.API_DOMAIN
  }${envVars.USE_PORT ? `:${envVars.PORT}` : ""}`,
  slwpBaseUrl: envVars.SLWP_BASE_URL,
  cloudinary: {
    cloudName: envVars.CLOUDINARY_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },

  redis: {
    host: envVars.REDIS_HOST,
    port: parseInt(envVars.REDIS_PORT || "6379"),
    url: envVars.REDIS_URL,
  },

  paymentData: {
    pagaAuthorizationKey: envVars.PAGA_AUTHORIZATION_KEY,
    koraskey: envVars.K_SKEY,
    korapkey: envVars.K_PKEY,
    koraekey: envVars.K_EKEY,

    fskey: envVars.F_SKEY,
    fekey: envVars.F_EKEY,
    fpkey: envVars.F_PKEY,
    fbaseUrl: envVars.F_BASE_URL,

    vtpasskey: envVars.VTPASS_KEY,
  },
  paymentProcessing: {
    storePaymentProcessingFee: envVars.STORE_PAYMENT_PROCESSING_FEE,
    storePaymentCharge: envVars.STORE_PAYMENT_CHARGE,
    withdrawalProcessingCost: envVars.WITHDRAWAL_PROCESSING_COST,
    withdrawalCharge: envVars.WITHDRAWAL_CHARGE,
    depositCharge: envVars.DEPOSIT_CHARGE,
    invoiceProcessingCost: envVars.INVOICE_PROCESSING_COST,
    invoiceProcessingCharge: envVars.INVOICE_PROCESSING_CHARGE,
    skillUpProcessingCost: envVars.INVOICE_PROCESSING_COST,
    skillUpProcessingCharge: envVars.INVOICE_PROCESSING_CHARGE,
    shopPurchaseFee: envVars.SHOP_PURCHASE_FEE,
    oneWeekPromotionCost: envVars.ONE_WEEK_PROMOTION_COST,
    twoWeekPromotionCost: envVars.TWO_WEEK_PROMOTION_COST,
    threeWeekPromotionCost: envVars.THREE_WEEK_PROMOTION_COST,
    oneMonthPromotionCost: envVars.ONE_MONTH_PROMOTION_COST,
  },
  notifier: {
    apiKey: envVars.NOTIFIER_KEY,
    twilloKey: envVars.TWILLON_KEY,
    baseUrl: envVars.SEND_CHAMP_BASE_URL,
  },

  dojah: {
    appId: envVars.DOJAH_APP_ID,
    privateKey: envVars.DOJAH_PRIVATE_KEY,
    production: envVars.DOJAH_PRODUCTION,
  },
};
