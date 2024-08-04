import { Schema, model } from 'mongoose';
import toJSON from '../../plugins/toJson.plugin';
import paginate from '../../plugins/paginate.plugin';
import { SCHEDULE_STATUS, SCHEDULE } from '../../../../config/constants';
import { ScheduleInterface } from '../../../../index';
import { Pagination } from '../../plugins/paginate.plugin';
import auditableFields from '../../plugins/auditableFields.plugin';

const scheduleSchema = new Schema<ScheduleInterface>(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduleCode: { type: String, required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    interval: { type: Number },
    duration: { type: String, enum: Object.values(SCHEDULE) },
    timesBilled: { type: Number, default: 0 },
    lastChargeDate: { type: Date },
    nextChargeDate: { type: Date },
    beneficiaries: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    startDate: { type: Date },
    status: {
      type: String,
      default: SCHEDULE_STATUS.INACTIVE,
      enum: Object.values(SCHEDULE_STATUS),
    },
    ...auditableFields,
  },
  {
    timestamps: true,
  }
);

scheduleSchema.plugin(toJSON);
scheduleSchema.plugin(paginate);
const Schedule: Pagination<ScheduleInterface> = model<
  ScheduleInterface,
  Pagination<ScheduleInterface>
>('Schedule', scheduleSchema);

export default Schedule;
