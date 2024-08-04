import { Schema, model } from "mongoose";
import auditableFields from "../plugins/auditableFields.plugin";
import { Work } from "../../../index";
import paginate, { Pagination } from "../plugins/paginate.plugin";
import toJSON from "../plugins/toJson.plugin";
import { WORK_STATUS } from "../../../config/constants";

const WorkSchema = new Schema<Work>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Oraganization",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: String,
    role: {
      type: String,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
    },

    token: String,
    expiry: Date,

    account: {
      bankCode: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountName: { type: String, required: true },
      bankName: { type: String, required: true },
    },
    
    balance: {
      trench: { type: Number, required: false },
      line: { type: Number, required: false }, // amount allowable
      exposure: { type: Number, required: false },
    },
    status: {
      reason: { type: String, required: false },
      status: {
        type: String,
        enum: Object.values(WORK_STATUS),
        default: WORK_STATUS.PENDING,
      },
    },
    ...auditableFields,
  },
  {
    timestamps: true,
  }
);
WorkSchema.plugin(toJSON);
WorkSchema.plugin(paginate);
const Work: Pagination<Work> = model<Work, Pagination<Work>>(
  "Work",
  WorkSchema
);

export default Work;
