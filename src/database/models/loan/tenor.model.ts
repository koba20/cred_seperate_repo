import { Schema, model } from "mongoose";
import auditableFields from "../../plugins/auditableFields.plugin";
import paginate, { Pagination } from "../../plugins/paginate.plugin";
import toJSON from "../../plugins/toJson.plugin";
import { Tenor } from "../../../..";
import { TENOR_STATUS } from "../../../../config/constants";

const TenorSchema = new Schema<Tenor>(
  {
    loan: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    
    dueAt: Date,
    index: Number,
    completedAt: Date,
    balanceAmount: Number,
    depositedAmount: Number,
    status: {
      reason: String,
      status: {
        type: String,
        enum: Object.values(TENOR_STATUS),
      },
    },

    transaction: [
      {
        type: Schema.Types.ObjectId,
        ref: "TransactionLog",
        required: false,
      },
    ],
    ...auditableFields,
  },
  {
    timestamps: true,
  }
);
TenorSchema.plugin(toJSON);
TenorSchema.plugin(paginate);
const Tenor: Pagination<Tenor> = model<Tenor, Pagination<Tenor>>(
  "Tenor",
  TenorSchema
);
export default Tenor;
