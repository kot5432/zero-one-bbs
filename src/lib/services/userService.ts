import { Timestamp } from 'firebase/firestore';
import { collections } from '../firebase/collections';
import { createDocument, updateDocument, deleteDocument, getDocument, getCollection } from '../firebase/utils';
import { User } from '../../types';

// ユーザー関連サービス
export class UserService {
  // ユーザー作成
  static async createUser(userData: Omit<User, 'id' | 'createdAt'>) {
    const newUser = {
      ...userData,
      createdAt: Timestamp.now()
    };
    return await createDocument(collections.users, newUser);
  }

  // ユーザー取得
  static async getUser(userId: string) {
    try {
      return await getDocument('users', userId);
    } catch (error) {
      console.error('UserService: Error getting user:', error);
      return null;
    }
  }

  // 全ユーザー取得
  static async getAllUsers() {
    return await getCollection(collections.users);
  }

  // ユーザー更新
  static async updateUser(userId: string, data: Partial<User>) {
    await updateDocument('users', userId, data);
  }

  // ユーザー削除
  static async deleteUser(userId: string) {
    await deleteDocument('users', userId);
    await this.deleteUserSettings(userId);
  }

  // ユーザー設定取得
  static async getUserSettings(userId: string) {
    const settings = await getDocument('userSettings', userId);
    if (settings) {
      return {
        id: settings.id,
        uid: (settings as any).uid || userId,
        email: (settings as any).email || '',
        displayName: (settings as any).displayName || '',
        createdAt: (settings as any).createdAt || Timestamp.now(),
        updatedAt: (settings as any).updatedAt || Timestamp.now()
      };
    }
    return null;
  }

  // 全ユーザー設定取得
  static async getAllUserSettings() {
    const allSettings = await getCollection(collections.userSettings);
    return allSettings.map((setting: any) => ({
      id: setting.id,
      uid: setting.uid || setting.id,
      email: setting.email || '',
      displayName: setting.displayName || '',
      createdAt: setting.createdAt || Timestamp.now(),
      updatedAt: setting.updatedAt || Timestamp.now()
    }));
  }

  // ユーザー設定削除
  static async deleteUserSettings(userId: string) {
    await deleteDocument('userSettings', userId);
  }

  // 削除ログ記録
  static async logDeletion(type: 'user' | 'idea' | 'theme', itemId: string, reason: string, deletedBy: string) {
    const deletionLog = {
      type,
      itemId,
      reason,
      deletedBy,
      deletedAt: Timestamp.now()
    };
    return await createDocument(collections.deletionLogs, deletionLog);
  }

  // 全削除ログ取得
  static async getAllDeletionLogs() {
    return await getCollection(collections.deletionLogs);
  }
}
