import { Timestamp } from 'firebase/firestore';
import { collections } from '../firebase/collections';
import { createDocument, updateDocument, getCollectionByField } from '../firebase/utils';
import { Notification, AdminComment } from '../../types';

// 通知サービス
export class NotificationService {
  // 通知作成
  static async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>) {
    const newNotification = {
      ...notificationData,
      createdAt: Timestamp.now()
    };
    return await createDocument(collections.notifications, newNotification);
  }

  // ユーザー通知取得
  static async getUserNotifications(userId: string) {
    return await getCollectionByField(collections.notifications, 'userId', userId);
  }

  // 通知を既読にする
  static async markAsRead(notificationId: string) {
    await updateDocument('notifications', notificationId, { isRead: true });
  }

  // 未読通知数取得
  static async getUnreadCount(userId: string) {
    const userNotifications = await getCollectionByField(collections.notifications, 'userId', userId);
    return userNotifications.filter((notification: any) => !notification.isRead).length;
  }
}

// 管理コメントサービス
export class AdminCommentService {
  // 管理コメント作成
  static async createAdminComment(commentData: Omit<AdminComment, 'id' | 'createdAt'>) {
    const newComment = {
      ...commentData,
      createdAt: Timestamp.now()
    };
    return await createDocument(collections.adminComments, newComment);
  }

  // アイデアの管理コメント取得
  static async getIdeaAdminComments(ideaId: string) {
    return await getCollectionByField(collections.adminComments, 'ideaId', ideaId);
  }
}
