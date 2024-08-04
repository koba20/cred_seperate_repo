import { Schema, model } from 'mongoose';
import toJSON from '../../plugins/toJson.plugin';
import paginate, { Pagination } from '../../plugins/paginate.plugin';
import { RegulateTransactionType } from '../../../../index';

const regulateTransactionSchema = new Schema<RegulateTransactionType>(
  {
    idempotentKey: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
regulateTransactionSchema.plugin(toJSON);
regulateTransactionSchema.plugin(paginate);

/**
 * @typedef RegulateTransaction
 */
const RegulateTransaction: Pagination<RegulateTransactionType> = model<
  RegulateTransactionType,
  Pagination<RegulateTransactionType>
>('RegulateTransaction', regulateTransactionSchema);

export default RegulateTransaction;
