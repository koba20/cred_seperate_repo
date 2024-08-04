import { Schema, model } from 'mongoose';
import paginate, { Pagination } from '../../plugins/paginate.plugin';
import auditableFields from '../../plugins/auditableFields.plugin';
import { SinntsEarningType } from '../../../../index';
import config from "../../../../config/config";

const SinntsEarningSchema = new Schema<SinntsEarningType>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    charge: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      default: 'card',
    },
    profit: Number,
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'TransactionLog',
    },
    amountSpent: Number,
    ...auditableFields,
  },
  { timestamps: true }
);

SinntsEarningSchema.plugin(paginate);

const SinntsEarning: Pagination<SinntsEarningType> = model<
  SinntsEarningType,
  Pagination<SinntsEarningType>
>(`${config.appName}Earnings`, SinntsEarningSchema);
export default SinntsEarning;
