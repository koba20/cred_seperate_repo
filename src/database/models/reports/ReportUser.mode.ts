import { Schema, model } from 'mongoose';
import { ReportUserInterface } from '../../../../index';
import paginate, { Pagination } from '../../plugins/paginate.plugin';
import toJSON from '../../plugins/toJson.plugin';
import auditableFields from '../../plugins/auditableFields.plugin';

const reportUserSchema = new Schema<ReportUserInterface>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

reportUserSchema.plugin(paginate);
reportUserSchema.plugin(toJSON);

const ReportUser: Pagination<ReportUserInterface> = model<
  ReportUserInterface,
  Pagination<ReportUserInterface>
>('ReportUser', reportUserSchema);

export default ReportUser;
