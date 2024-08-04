import { NotificationType } from '../../index';
import Notification from '../database/models/Notification.model';

export const createNotification = async (data: Partial<NotificationType>) => {
  const notification = await Notification.create(data);
  return notification;
};

export const getAllNotifications = async (
  filter: Partial<NotificationType>,
  options: {
    orderBy?: string;
    page?: string;
    limit?: string;
    populate?: string;
  } = {},
  ignorePagination = false
) => {
  const data = ignorePagination
    ? Notification.find({ ...filter })
    : await Notification.paginate(filter, options);
  return data;
};
