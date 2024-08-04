import { Schema, model } from 'mongoose';
import auditableFields from '../plugins/auditableFields.plugin';
import { Account } from '../../../index';
import paginate, { Pagination } from '../plugins/paginate.plugin';
import toJSON from '../plugins/toJson.plugin';
import { WALLET_MODE } from '../../../config/constants';

const AccountSchema = new Schema<Account>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    walletType: { type: String, enum: ['user', 'super_admin'] },
    walletMode: {
      type: String,
      enum: Object.values(WALLET_MODE),
      default: WALLET_MODE.STRICT,
    },
    transactionPin: String,
    availableBalance: { type: Number, default: 0 },
    ledgerBalance: { type: Number, default: 0 },
    sharedBalance: { type: Number, default: 0 },
    reservedBalance: { type: Number, default: 0 },
    accountNumber: String,
    username: String,
    accountName: String,
    bankName: String,
    bankReferenceNumber: String,
    accountReference: String,
    stash: String,
    callbackUrl: String,
    lock: {
      isLocked: { type: Boolean, default: false },
      updatedAt: Date,
      lockedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
      },
      reason: String,
    },
    qrCode: String,
    ...auditableFields,
  },
  {
    timestamps: true,
  }
);
AccountSchema.plugin(toJSON);
AccountSchema.plugin(paginate);
const Account: Pagination<Account> = model<Account, Pagination<Account>>(
  'Account',
  AccountSchema
);
export default Account;
