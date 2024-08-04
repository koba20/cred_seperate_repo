import { Schema, model } from 'mongoose';
import toJSON from '../../plugins/toJson.plugin';
import paginate, { Pagination } from '../../plugins/paginate.plugin';
import { TransactionDumpInterface } from '../../../../index';

const transactionDumpSchema = new Schema<TransactionDumpInterface>(
  {
    data: {
      type: Object,
    },
    user: {
      type: Schema.Types.ObjectId,
      required: false,
      default: null,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
transactionDumpSchema.plugin(toJSON);
transactionDumpSchema.plugin(paginate);

/**
 * @typedef TransactionDump
 */
const TransactionDump: Pagination<TransactionDumpInterface> = model<
  TransactionDumpInterface,
  Pagination<TransactionDumpInterface>
>('TransactionDump', transactionDumpSchema);

export default TransactionDump;
