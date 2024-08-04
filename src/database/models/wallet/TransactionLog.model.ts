import { Schema, model } from 'mongoose';
import {
  TRANSACTION_SOURCES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} from '../../../../config/constants';
import auditableFields from '../../plugins/auditableFields.plugin';
import toJSON from '../../plugins/toJson.plugin';
import paginate, { Pagination } from '../../plugins/paginate.plugin';
import { TRANSACTION_CATEGORIES } from '../../../../config/constants';
import { TransactionLogInterface } from '../../../..';

const transactionLogSchema = new Schema<TransactionLogInterface>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    initiator: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    receiver: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    balanceAfterTransaction: {
      type: Number,
    },
    fee: { type: Number, default: 0 },
    transactionDump: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'TransactionDump',
    },
    type: {
      type: String,
      enums: Object.values(TRANSACTION_TYPES),
    },
    category: {
      type: String,
      enums: Object.values(TRANSACTION_CATEGORIES),
    },
    amount: {
      type: Number,
    },
    source: {
      type: String,
      enum: Object.values(TRANSACTION_SOURCES),
    },
    reference: {
      type: String,
      required: false,
    },
    purpose: {
      type: String,
      required: false,
    },
    meta: {
      type: Object,
    },
    pending: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      required: false,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
    },
    ...auditableFields,
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
transactionLogSchema.plugin(toJSON);
transactionLogSchema.plugin(paginate);

/**
 * @typedef TransactionLog
 */
const TransactionLog: Pagination<TransactionLogInterface> = model<
  TransactionLogInterface,
  Pagination<TransactionLogInterface>
>('TransactionLog', transactionLogSchema);

export default TransactionLog;
