import { Schema, model } from 'mongoose';
import paginate, { Pagination } from '../plugins/paginate.plugin';

import { NOTIFICATION_TYPE } from '../../../config/constants';
import { NotificationType } from '../../../index';
import auditableFields from '../plugins/auditableFields.plugin';
import toJSON from '../plugins/toJson.plugin';

const notificationSchema = new Schema<NotificationType>(
  {
    body: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    meta: Map,
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
    },
    ...auditableFields,
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
notificationSchema.plugin(toJSON);
notificationSchema.plugin(paginate);

/**
 * @typedef Notification
 */
const Notification: Pagination<NotificationType> = model<
  NotificationType,
  Pagination<NotificationType>
>('Notification', notificationSchema);

export default Notification;
