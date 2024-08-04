import { Schema, model } from "mongoose";
import auditableFields from "../../plugins/auditableFields.plugin";
import paginate, { Pagination } from "../../plugins/paginate.plugin";
import toJSON from "../../plugins/toJson.plugin";
import { Loan } from "../../../..";
import { LOAN_STATUS } from "../../../../config/constants";

const LoanSchema = new Schema<Loan>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Oraganization",
      required: true,
    },
    work: {
      type: Schema.Types.ObjectId,
      ref: "Work",
      required: true,
    },

    tenors: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tenor",
        required: true,
      },
    ],
    duration: {
      startDate: Date,
      endDate: Date,
    },
    amount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    outstanding: {
      type: Number,
      required: true,
    },
    month: Number,
    interestAmount: {
      type: Number,
      required: true,
    },
    disposmentAt: Date,
    status: {
      reason: String,
      status: {
        type: String,
        default: LOAN_STATUS.PENDING,
        enum: Object.values(LOAN_STATUS),
      },
    },

    interest: Number,
    ...auditableFields,
  },
  {
    timestamps: true,
  }
);
LoanSchema.plugin(toJSON);
LoanSchema.plugin(paginate);
const Loan: Pagination<Loan> = model<Loan, Pagination<Loan>>(
  "Loan",
  LoanSchema
);
export default Loan;
