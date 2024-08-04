import { Schema, model } from 'mongoose';
import { Report } from '../../../../index';
import paginate, { Pagination } from '../../plugins/paginate.plugin';
import toJSON from '../../plugins/toJson.plugin';
import auditableFields from '../../plugins/auditableFields.plugin';
import { REPORT_CATEGORY, REPORT_STATUS } from '../../../../config/constants';

const ReportSchema = new Schema<Report>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    reportedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(REPORT_CATEGORY),
    },
    status: {
      status: {
        type: String,
        enum: Object.values(REPORT_STATUS),
        default: REPORT_STATUS.PENDING,
      },
      resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
      },
      reason: String,
    },
    ...auditableFields,
  },
  { timestamps: true }
);

ReportSchema.plugin(paginate);
ReportSchema.plugin(toJSON);

const Report: Pagination<Report> = model<Report, Pagination<Report>>(
  'Report',
  ReportSchema
);

export default Report;
