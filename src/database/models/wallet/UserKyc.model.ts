import { Schema, model } from 'mongoose';
import { UserKyc } from '../../../..';
import paginate, { Pagination } from '../../plugins/paginate.plugin';
import toJSON from '../../plugins/toJson.plugin';
import auditableFields from '../../plugins/auditableFields.plugin';

const userKycSchema = new Schema<UserKyc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
    }, 
    tier: {
      type: String,
      enum: ['tier1', 'tier2', 'tier3'],
      default: 'tier1',
    },
    bvn: {
      bvn: {
        type: String,
      },
      status: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending',
      },
    },
    info: {
      dateOfBirth: Date,
      postalCode: String,
    },
    document: {
      passportPhotograph: {
        url: String,
        publicId: String,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
      },
    },
    ...auditableFields,
  },
  { timestamps: true }
);
userKycSchema.plugin(toJSON);
userKycSchema.plugin(paginate);
const UserKyc: Pagination<UserKyc> = model<UserKyc, Pagination<UserKyc>>(
  'UserKyc',
  userKycSchema
);

export default UserKyc;
