import { Schema, model } from "mongoose";
import paginate, { Pagination } from "../plugins/paginate.plugin";
import toJSON from "../plugins/toJson.plugin";
import {
  ACCOUNT_STATUS,
  BVN_STATUS,
  GENDER,
  PORTFOLIO,
} from "../../../config/constants";
import auditableFields from "../plugins/auditableFields.plugin";
import { User } from "../../..";

const userSchema = new Schema<User>(
  {
    work: {
      type: Schema.Types.ObjectId,
      ref: "Oraganization",
      required: false,
    },
    requestToJoin: {
      type: Schema.Types.ObjectId,
      ref: "Oraganization",
      required: false,
    },
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      // unique: true,
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
    isPhoneNumberVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetToken: String,
    resetTokenExpiresAt: Date,

    otpToken: String,
    otpTokenExpiry: Date,

    pushNotificationId: {
      type: String,
      required: false,
    },

    dob: Date,
    referrer: String,
    portfolio: {
      type: String,
      enum: Object.values(PORTFOLIO),
      default: PORTFOLIO.MEMBER,
    },
    userAppVersion: String,
    gender: {
      type: String,
      enum: Object.values(GENDER),
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    avatar: {
      url: {
        type: String,
        required: false,
      },
      public_id: {
        type: String,
        required: false,
      },
      source: {
        type: String,
        required: false,
        enum: ["firebase", "cloudinary"],
        default: "cloudinary",
      },
    },
    referralCode: String,
    inviteCode: String,
    accountStatus: {
      status: {
        type: String,
        enum: Object.values(ACCOUNT_STATUS),
        default: ACCOUNT_STATUS.PENDING,
      },
      reason: String,
    },
    settings: {
      allowPushNotifications: {
        type: Boolean,
        default: true,
      },
      isAccountPrivate: {
        type: Boolean,
        default: false,
      },

      deviceInfo: [Map],
    },
    meta: Object,
    kyc: {
      tier: {
        type: String,
        enum: ["tier1", "tier2", "tier3"],
        default: "tier1",
      },
      nin: {
        nin: {
          type: String,
        },
        status: {
          type: String,
          enum: Object.values(BVN_STATUS),
          default: BVN_STATUS.PENDING,
        },
      },
      bvn: {
        bvn: {
          type: String,
        },
        status: {
          type: String,
          enum: Object.values(BVN_STATUS),
          default: BVN_STATUS.PENDING,
        },
      },
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
        delete ret.verificationToken;
        return ret;
      },
    },
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * @typedef User
 */
const User: Pagination<User> = model<User, Pagination<User>>(
  "User",
  userSchema
);

export default User;
