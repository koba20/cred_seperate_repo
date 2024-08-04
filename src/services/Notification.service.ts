import Notification from '../database/models/Notification.model';
import { NotificationType } from '../..';

export default class NotificationService {
  static async createNotification(data: Partial<NotificationType>) {
    const notification = await Notification.create(data);
    return notification;
  }

  static async getAllNotifications(
    filter: Partial<NotificationType>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePagination = false
  ) {
    const data = ignorePagination
      ? await Notification.find({ ...filter })
      : await Notification.paginate(filter, options);
    return data;
  }

  static async updateNotification(
    notificationId: string,
    body: Partial<NotificationType>
  ) {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      body,
      { new: true }
    );
    return notification;
  }
}
