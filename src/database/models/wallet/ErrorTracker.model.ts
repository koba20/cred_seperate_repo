import { Schema, model } from 'mongoose';
import toJSON from '../../plugins/toJson.plugin';
import paginate, { Pagination } from '../../plugins/paginate.plugin';
import { ErrorTrackerType } from '../../../../index';

const errorTrackerSchema = new Schema<ErrorTrackerType>(
  {
    stackTrace: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
errorTrackerSchema.plugin(toJSON);
errorTrackerSchema.plugin(paginate);

/**
 * @typedef ErrorTracker
 */
const ErrorTracker: Pagination<ErrorTrackerType> = model<
  ErrorTrackerType,
  Pagination<ErrorTrackerType>
>('ErrorTracker', errorTrackerSchema);

export default ErrorTracker;
