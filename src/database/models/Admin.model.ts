/* eslint-disable no-param-reassign */
import { Schema, model } from 'mongoose';
import paginate, { Pagination } from '../plugins/paginate.plugin';
import toJSON from '../plugins/toJson.plugin';
import { ACCOUNT_STATUS, ADMIN_ROLE, GENDER } from '../../../config/constants';
import auditableFields from '../plugins/auditableFields.plugin';
import { Admin } from '../../..';

const adminSchema = new Schema<Admin>(
  {
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: Date,
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetToken: String,
    resetTokenExpiresAt: Date,
    role: {
      type: String,
      enum: Object.values(ADMIN_ROLE),
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    accountStatus: {
      status: {
        type: String,
        enum: Object.values(ACCOUNT_STATUS),
        default: ACCOUNT_STATUS.PENDING,
      },
      reason: String,
    },
    avatar: {
      url: String,
      publicId: String,
    },
    gender: {
      type: String,
      enum: Object.values(GENDER),
    },
    ...auditableFields,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret._id;
        delete ret.resetToken;
        delete ret.resetTokenExpiresAt;
        delete ret.__v;
        delete ret.password;
        delete ret.verificationTokenExpiry;
        return ret;
      },
    },
  }
);

adminSchema.plugin(toJSON);
adminSchema.plugin(paginate);

const Admin: Pagination<Admin> = model<Admin, Pagination<Admin>>(
  'Admin',
  adminSchema
);

export default Admin;
