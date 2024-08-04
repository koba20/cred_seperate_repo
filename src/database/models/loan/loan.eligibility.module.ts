import { Schema, model } from "mongoose";
import auditableFields from "../../plugins/auditableFields.plugin";
import paginate, { Pagination } from "../../plugins/paginate.plugin";
import toJSON from "../../plugins/toJson.plugin";
import { Eligibility } from "../../../..";
import { ELIGIBILITY_STATUS } from "../../../../config/constants";

const EligibilitySchema = new Schema<Eligibility>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    loan: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: false,
    },
    work: {
      type: Schema.Types.ObjectId,
      ref: "Work",
      required: true,
    },
    months: {
      type: Number,
      default: 0,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
      required: true,
    },
    status: {
      reason: String,
      status: {
        type: String,
        default: ELIGIBILITY_STATUS.NOT_ELIGIBLE,
        enum: Object.values(ELIGIBILITY_STATUS),
      },
    },
    ...auditableFields,
  },
  {
    timestamps: true,
  }
);
EligibilitySchema.plugin(toJSON);
EligibilitySchema.plugin(paginate);
const Eligibility: Pagination<Eligibility> = model<
  Eligibility,
  Pagination<Eligibility>
>("Eligibility", EligibilitySchema);
export default Eligibility;
