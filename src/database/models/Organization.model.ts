import { Schema, model } from "mongoose";
import auditableFields from "../plugins/auditableFields.plugin";
import { Organization } from "../../../index";
import paginate, { Pagination } from "../plugins/paginate.plugin";
import toJSON from "../plugins/toJson.plugin";
import { ACCOUNT_STATUS } from "../../../config/constants";

const OrganizationSchema = new Schema<Organization>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    interest: {
      type: Number,
      required: false,
      default: 0,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    loanInfo: {
      interest: { type: Number, required: false },
      creditLimit: { type: Number, required: false },
    },
    logo: {
      url: {
        type: String,
        required: false,
      },
      public_id: {
        type: String,
        required: false,
      },
      source: {
        type: String,
        required: false,
        enum: ["firebase", "cloudinary"],
        default: "cloudinary",
      },
    },
    coperateInfo: { rcNumber: String },
    hrInfo: {
      firstName: String,
      lastName: String,
      middleName: String,
      email: String,
    },
    repaymentInfo: {
      payday: { type: Schema.Types.Mixed, required: false },
    },
    accountStatus: {
      reason: { type: String, required: false },
      status: {
        type: String,
        enum: Object.values(ACCOUNT_STATUS),
        default: ACCOUNT_STATUS.PENDING,
      },
    },
    ...auditableFields,
  },
  {
    timestamps: true,
  }
);
OrganizationSchema.plugin(toJSON);
OrganizationSchema.plugin(paginate);
const Oraganization: Pagination<Organization> = model<
  Organization,
  Pagination<Organization>
>("Oraganization", OrganizationSchema);

export default Oraganization;
