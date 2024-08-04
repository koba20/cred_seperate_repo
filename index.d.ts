import {
  ACCOUNT_STATUS,
  ARTISAN_HIRE_REQUEST_STATUS,
  BADGE_REQUEST_CATEGORY,
  BADGE_REQUEST_STATUS,
  BVN_STATUS,
  ELIGIBILITY_STATUS,
  EMPOWERMENT_STATUS,
  LOAN_STATUS,
  NIN_STATUS,
  POLL_CONTESTANT_STATUS,
  POLL_STATUS,
  POLL_TYPE,
  PRODUCT_STATUS,
  REPORT_CATEGORY,
  TENOR_STATUS,
  WORK_STATUS,
  CARD_STATUS,
} from "./config/constants";
import {
  SCHEDULE_STATUS,
  SERVICE_TYPES,
  MediaType,
  NOTIFICATION_TYPE,
} from "./config/constants";
import {
  SKILL_UP_STATUS,
  STATUS,
  SKILL_UP_ORDER_STATUS,
  SHOP_STATUS,
} from "./config/constants";
import {
  ADMIN_ROLE,
  CommentType,
  GENDER,
  PROMOTION_TYPE,
  PostType,
  PORTFOLIO,
  TRANSACTION_SOURCES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} from "./config/constants";
export type registerPersistentPaymentAccount = {
  referenceNumber: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  accountName: string;
  financialIdentificationNumber: string;
  accountReference: string;
  creditBankId: string | null;
  creditBankAccountNumber: string | null;
  callbackUrl: string | null;
};

interface TokenizedCard extends AuditableFields {
  _id: string;
  hash: string;
  user: string | User;
  status: CARD_STATUS;
  customer: string;
  cardRef: string;
  cardTransactionRef: string;
  cardToken: string;
  cardLast4: string;
  cardFirst6: string;
  cardType: string;
  cardBrand: string;
  exp: string;
  currency: "NGN" | "USD";
}

//* flutterwave
export interface FlutterResponse extends FlutterwaveBaseResponse {
  [key: string]: any;
}

interface FlutterwaveBaseResponse {
  status: string;
  message: string;
  data?: any;
}

export interface KoraResponse extends KoraBaseResponse {
  [key: string]: any;
}

export interface KoraVirtualAccount extends KoraBaseVirtualAccount {
  account_name: string;
  account_number: string;
  bank_code: string;
  bank_name: string;
  account_reference: string;
  unique_id: string;
  account_status: string;
  currency: string;
  customer: {
    name: string;
  };
}
export interface VtpassResponse extends VtpassBaseResponse {
  [key: string]: any;
}

export interface PaginationOptions {
  populate?: string;
  select?: string;
  orderBy?: string;
  limit?: string;
  page?: string;
}

export interface PaginationModel<T> {
  totalData: number | undefined;
  limit: number | undefined = 0;
  totalPages: number | undefined;
  page: number | undefined;
  data: T[] = [];
}

export interface GetBanksType extends KoraBaseResponses {
  status: boolean;
  message: string;
  data: BankInterface[];
}

// Company interface model
export interface Organization {
  id: string;
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  interest: number;
  loanInfo: {
    interest: number;
    creditLimit: number;
  };
  repaymentInfo: {
    payday: number;
  };
  accountStatus: {
    status: ACCOUNT_STATUS;
    reason: string;
  };
  logo: { url: string; public_id: string };
  coperateInfo: { rcNumber: string };
  hrInfo: { name: string; email: string };
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export interface inAppTransfer {
  reference: string;
  amount: number;
  idempotentKey: string;
  username: string;
  purpose: string;
  transactionCategory?: string;
  Account: string;
}

export interface Work extends AuditableFields {
  _id: string;
  organization: string | Organization;
  role: string;
  email: string;
  salary: number;
  user: string | User;
  token: String;
  expiry: Date;
  account: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
  };
  balance: {
    line: number;
    trench: number;
    exposure?: number;
  };
  status: {
    status: WORK_STATUS;
    reason?: string;
  };
}

export interface Loan extends AuditableFields {
  _id: string;
  amount: number;
  totalAmount: number;
  outstanding: number;
  work: string | Work;
  interest: number;
  month: number;
  interestAmount: number;
  organization: string | Organization;
  user: string | User;
  admin?: string | Admin;
  tenors: Tenor[] |  string [] | null;
  disposmentAt: Date;
  status: {
    status: LOAN_STATUS;
    reason: string;
  };

  duration: Duration;
}

export interface Tenor extends AuditableFields {
  _id: string;
  dueAt: Date;
  index: number;
  amount: number;
  balanceAmount: number;
  loan: string | Loan;
  user: string | User;
  depositedAmount: number;
  transaction?: (TransactionLogInterface | string)[] | null;
  completedAt?: Date;
  status: {
    status: TENOR_STATUS;
    reason: string;
  };
}

export interface Duration {
  startDate: Date;
  endDate: Date;
}

export interface Account {
  user: User | string;
  admin: Admin | string;
  walletType: "user" | "super_admin";
  id: string;
  accountNumber: string;
  transactionPin: string;
  accountName: string;
  bankName: string;
  availableBalance: number;
  ledgerBalance: number;
  reservedBalance: number;
  sharedBalance: number;
  accountNumber: string;
  username: string;
  locked: boolean;
  lock: {
    isLocked: boolean;
    reason: string;
    lockedBy: Admin;
    updatedAt: Date;
  };
  accountName: string;
  bankName: string;
  bankReferenceNumber: string;
  accountReference: string;
  stash: string;
  callbackUrl: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  walletMode: string;
  qrCode: string;
}

export interface User {
  id: string;
  _id: string | string[] | User[];
  work?: sting | Work | null;
  firstName: string;
  middleName: string;
  lastName: string;
  referrer?: string | any;
  email: string;
  isEmailVerified: boolean;
  isPhoneNumberVerified: boolean;
  emailVerifiedAt: Date;
  verificationToken: string;
  verificationTokenExpiry: Date;
  resetToken: string;
  resetTokenExpiresAt: Date;
  password: string;
  otpTokenExpiry: Date;
  otpToken: string;
  pushNotificationId?: string;
  portfolio: PORTFOLIO;
  username: string;
  userAppVersion: string;
  gender: GENDER;
  otpLogin: string;
  resetToken: string;
  resetTokenExpiresAt: Date;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  avatar: { url: string; public_id: string };
  deviceInfo: Map;
  accountStatus: {
    status: ACCOUNT_STATUS;
    reason: string;
  };
  meta?: {
    [key: string]: string;
  };
  dob: Date;
  referralCode: string;
  inviteCode: string;
  settings: {
    allowPushNotifications?: boolean;
    isAccountPrivate?: boolean;
    deviceInfo?: (typeof Map)[];
  };
  requestToJoin: string | Organization | null;
  info?: Map;
  kyc?: {
    tier: "tier1" | "tier2" | "tier3";
    bvn: {
      bvn: string;
      status: BVN_STATUS;
    };
    nin: {
      nin: string;
      status: NIN_STATUS;
    } | null;
  };
}

export interface Eligibility extends AuditableFields {
  _id: string;
  user: string | User;
  loan?: string | Loan;
  work: string | Work;
  months: number;
  amount: number;
  status: {
    status: ELIGIBILITY_STATUS;
    reason?: string;
  };
}

export interface EmailConfig {
  personalizations: Personalization[];
  content: Content[];
  from: From;
  reply_to: ReplyTo;
}

export interface Personalization {
  to: To[];
  subject: string;
}

export interface To {
  email: string;
  name: string;
}

export interface Content {
  type: string;
  value: string;
}

export interface From {
  email: string;
  name: string;
}

export interface ReplyTo {
  email: string;
  name: string;
}

export interface purchaseUtilitiesType extends VtpassBaseResponse {
  code: string;
  content: string;
}
export interface ValidateCustomerReference extends VtpassBaseResponse {
  code: string;
  content: any;
}

export interface BankInterface {
  id: string;
  code: string;
  name: string;
}

export interface Admin extends AuditableFields {
  id: string;
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  emailVerifiedAt: Date;
  verificationToken: string;
  verificationTokenExpiry: Date;
  resetToken: string;
  resetTokenExpiresAt: Date;
  accountStatus: {
    status: ACCOUNT_STATUS;
    reason: string;
  };
  role: ADMIN_ROLE;
  phoneNumber: string;
  username: string;
  avatar: {
    url: string;
    publicId: string;
  };
  gender: GENDER;
}

export interface TransactionLogInterface {
  id: string;
  user: User | string | null;
  amount: number;
  transactionDump: TransactionDumpInterface | string | null;
  type: TRANSACTION_TYPES;
  category: string | null;
  source: TRANSACTION_SOURCES;
  reference: string | null;
  purpose: string | null;
  meta: object | null;
  pending: boolean | null;
  status: TRANSACTION_STATUS;
  locked: boolean | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
  admin: Admin | string | null;
  initiator: "USER" | "ADMIN";
  receiver: "USER" | "ADMIN";
  balanceAfterTransaction: number;
  fee: number;
}

export interface TransactionDumpInterface {
  id: string;
  data: object;
  user: User | string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export type RegulateTransactionType = {
  id: string;
  idempotentKey: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
};

export type SinntsEarningType = {
  id: string;
  user: User | string;
  amount: number;
  charge: number;
  source: string;
  profit: number;
  amountSpent: number;
  transaction: TransactionLogInterface | string | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
};

export type ErrorTrackerType = {
  id: string;
  stackTrace: Map;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
};

export type NotificationType = {
  id: string;
  user: User | string;
  body: string;
  title: string;
  type: NOTIFICATION_TYPE;
  read: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
  meta: Map | null;
};

export type CategoriesType = {
  id: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
};

export type ParentChildCommentType = {
  id: string;
  parentPostCommentId: PostComment | string | null;
  childPostCommentId: PostComment | string | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
};

export type ProductCategoriesType = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
};

export type Event = {
  id: string;
  title: string;
  location: string | null;
  description: string | null;
  photo: string | null;
  date: Date;
  time: Date;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
};
export interface Report {
  id: string;
  _id: string;
  user: User | string;
  post: PostInterface | string;
  product: PostInterface | string;
  transaction: TransactionLogInterface | string;
  reportedUser: User | string;
  shop: Shop | string;
  category: REPORT_CATEGORY;
  reason: string;
  description: string;
  status: {
    status: REPORT_STATUS;
    reason: string;
    resolvedBy: Admin | string;
  };
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface ReportTransactionInterface {
  id: string;
  _id: string;
  user: User | string;
  transaction: TransactionLogInterface | string;
  reason: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface ReportUserInterface {
  id: string;
  _id: string;
  user: User | string;
  reportedUser: User | string;
  reason: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface ScheduleInterface extends AuditableFields {
  id: string;
  _id: string;
  beneficiaries: User[] | string[];
  creator: User | string;
  name: string;
  amount: number;
  interval: number;
  duration: string;
  timesBilled: number;
  lastChargeDate: Date;
  nextChargeDate: Date;
  startDate: Date;
  status: SCHEDULE_STATUS;
  scheduleCode: string;
}

interface AuditableFields {
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
  createdBy: User | string;
  updatedBy: User | string;
  deletedBy: User | string;
}

interface KoraBaseResponse {
  status: boolean;
  message: string;
  data?: any;
}
interface CheckAccountBalanceRequest {
  referenceNumber: string;
  accountPrincipal: string;
  accountCredentials: string;
  sourceOfFunds: string;
  locale: string;
}

export interface SendChampConstructor {}

interface UserKyc extends AuditableFields {
  id: string;
  _id: string;
  user: User | string;
  bvn?: {
    bvn?: string;
    status?: "pending" | "approved" | "rejected";
  };
  document: {
    passportPhotograph?: {
      url?: string;
      publicId?: string;
    };
    status?: "pending" | "approved" | "rejected";
    // documentType: 'nationalId' | 'internationalPassport' | 'driversLicense';
  };
  info: {
    dateOfBirth?: string;
    postalCode?: string;
  };
  // approvedBy: Admin | string;
  tier?: "tier1" | "tier2" | "tier3";
}

export interface SendChampEndpoints {
  SEND_SMS: string;
  SEND_VOICE: string;
  SEND_EMAIL: string;
  SEND_EMAIL_SENDGRID: string;
  getReport: (sms_message_id: string) => string;
  REGISTER_SENDER: string;
  SEND_VERIFICATION_OTP: string;
  VERIFY_VERIFICATION_OTP: string;
  SEND_WHATSAPP: string;
}

export type SendChampBaseUrls = {
  [x: string]: string;
};

export interface SendSMSConfig {
  route?: "non_dnd" | "dnd" | "international";
  to: string | Array<string>;
  message: string;
  sender_name: string;
}

export interface SendOtpConfig {
  channel: "sms" | "email";
  sender: string;
  token_type: "numeric" | "alphanumeric";
  token_length: number;
  expiration_time: number; // In minutes
  customer_email_address?: string;
  customer_mobile_number?: string;
  meta_data?: Record<string | number, unknown>;
  token: string;
}

export interface VerifyOtpConfig {
  verification_reference: string;
  verification_code: string;
}

export interface RegisterSenderConfig {
  name: string;
  use_case: "transactional" | "marketing" | "transaction_marketing";
  sample: string;
}

export interface SendWHATSAPPTemplateConfig {
  sender: string;
  recipient: string;
  template_code: string;
  meta_data: { [x: string]: string };
}

export interface SendWHATSAPPTextConfig {
  recipient: string;
  sender: string;
  message: string;
}

export interface SendWHATSAPPVideoConfig {
  recipient: string;
  sender: string;
  link: string;
}

export interface SendWHATSAPPAudioConfig {
  recipient: string;
  sender: string;
  link: string;
  message: string;
}

export interface SendWHATSAPPLocationConfig {
  recipient: string;
  sender: string;
  longitude: number;
  latitude: number;
  name: string;
  address: string;
}

export interface SendSMSResponse {
  message: string;
  code: string;
  status: "success" | "error";
  data: SMSResponseData;
}

export interface SendVOICEResponse {
  message: string;
  code: string;
  data: VOICEResponseData;
  status: "success" | "error";
}

export interface SendOtpResponse {
  message: string;
  code: string;
  status: "success" | "error";
  data: SendOtpResponseData;
}

export interface VerifyOtpResponse {
  message: string;
  code: string;
  status: "success" | "error";
  data: VerifyOtpResponseData;
}

export interface SendWHATSAPPResponse {
  message: string;
  code: string;
  status: "success" | "error";
  data: SendWhatsappResponseData;
}

interface SendWhatsappResponseData {
  provider_reference: string;
  provider_message: string;
  provider_status: string;
}

interface SMSResponseData {
  status: string;
  business: string;
  id: string;
  uid?: string;
  business_uid?: string;
  name?: string;
  phone_number?: string;
  amount: string;
  reference: string;
  message_references?: Array<string>;
  delivered_at?: string;
  sent_at?: string;
}

interface VOICEResponseData {
  phone_number: string;
  id: string;
  status: string;
  reference: string;
}

interface SendOtpResponseData {
  business_uid: string;
  reference: string;
  channel: {
    id: number;
    name: string;
    is_active: boolean;
  };
  token?: string;
  status: string;
}

export interface SendEmailConfig {
  subject: string;
  to: {
    email: string;
    name: string;
  };
  from: {
    email: string;
    name: string;
  };
  message_body: {
    type: "plain text";
    value: string;
  };
}

interface VerifyOtpResponseData {
  id: string;
  business_id: string;
  business_customer_id: string;
  channel_id: string;
  verification_code: string;
  delivery_status: string;
  verification_status: string;
  expires_at: string;
  verification_time: string;
  created_at: string;
  updated_at: string;
  verification_reference: string;
  meta_data: unknown;
}

interface BaseResponse {
  error: boolean;
  status: string;
  message: string;
  Message: string;
}

interface ValidateBVNResponse extends BaseResponse {
  bvn: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  gender: string;
  date_of_birth: string;
  phone_number1: string;
  image: string;
  phone_number2: string;
}

export interface ValidateNINResponse extends BaseResponse {
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  employment_status: string;
  photo: string;
}
