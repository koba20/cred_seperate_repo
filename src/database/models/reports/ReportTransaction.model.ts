import { Schema, model } from 'mongoose';
import { ReportTransactionInterface } from '../../../../index';
import paginate, { Pagination } from '../../plugins/paginate.plugin';
import toJSON from '../../plugins/toJson.plugin';
import auditableFields from '../../plugins/auditableFields.plugin';

const reportTransactionSchema = new Schema<ReportTransactionInterface>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'rejected'],
      default: 'pending',
    },
    ...auditableFields,
  },
  { timestamps: true }
);

reportTransactionSchema.plugin(paginate);
reportTransactionSchema.plugin(toJSON);

const ReportTransaction: Pagination<ReportTransactionInterface> = model<
  ReportTransactionInterface,
  Pagination<ReportTransactionInterface>
>('ReportTransaction', reportTransactionSchema);

export default ReportTransaction;
