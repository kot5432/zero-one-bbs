import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getUser, createUser, User } from './firestore';

// 簡易的なユーザー管理（IPベースから移行）
export class SimpleAuth {
  private static instance: SimpleAuth;
  private currentUser: User | null = null;

  static getInstance(): SimpleAuth {
    if (!SimpleAuth.instance) {
      SimpleAuth.instance = new SimpleAuth();
    }
    return SimpleAuth.instance;
  }

  // IPアドレスからユーザーIDを生成（簡易実装）
  private generateUserId(ip: string): string {
    // IPアドレスをハッシュ化してユーザーIDにする
    // 本来はUUIDなどを使うが、今回は簡易実装
    return btoa(ip).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  }

  // ユーザーを取得または作成
  async getOrCreateUser(ip: string, username?: string): Promise<User> {
    const userId = this.generateUserId(ip);
    
    let user = await getUser(userId);
    
    if (!user) {
      // 新規ユーザー作成
      const userData = {
        username: username || `ユーザー${userId.substring(0, 6)}`,
        postCount: 0,
        themeCount: 0
      };
      
      const docRef = await createUser(userData);
      user = {
        id: docRef.id,
        ...userData,
        createdAt: new Date() as any
      };
      
      // IDを設定（本来はcreateDocでIDを取得できるが、簡易実装）
      await this.updateUser(userId, { id: docRef.id });
    } else {
      // 最終ログインを更新
      await this.updateUser(userId, { lastLoginAt: new Date() as any });
    }
    
    this.currentUser = user;
    return user;
  }

  // ユーザー情報更新
  private async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updates, { merge: true });
  }

  // 投稿数を増やす
  async incrementPostCount(userId: string): Promise<void> {
    const user = await getUser(userId);
    if (user) {
      await this.updateUser(userId, {
        postCount: user.postCount + 1
      });
    }
  }

  // テーマ参加数を増やす
  async incrementThemeCount(userId: string): Promise<void> {
    const user = await getUser(userId);
    if (user) {
      await this.updateUser(userId, {
        themeCount: user.themeCount + 1
      });
    }
  }

  // 現在のユーザーを取得
  getCurrentUser(): User | null {
    return this.currentUser;
  }
}

// エクスポート
export const auth = SimpleAuth.getInstance();
