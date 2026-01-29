import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  deleteUser as deleteFirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth as firebaseAuthInstance, db } from './firebase';
import { getUser, createUser, User } from './firestore';

// ユーザー設定のインターフェース
export interface UserSettings {
  uid: string;
  email: string;
  displayName: string;
  createdAt: any;
  updatedAt: any;
}

// Firebase Authentication認証クラス
export class FirebaseAuth {
  private static instance: FirebaseAuth;
  private currentUser: User | null = null;
  private firebaseUser: FirebaseUser | null = null;

  static getInstance(): FirebaseAuth {
    if (!FirebaseAuth.instance) {
      FirebaseAuth.instance = new FirebaseAuth();
    }
    return FirebaseAuth.instance;
  }

  // 認証状態の監視
  initAuthStateListener(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(firebaseAuthInstance, async (firebaseUser) => {
        this.firebaseUser = firebaseUser;
        
        if (firebaseUser) {
          // ユーザー設定を取得または作成
          let user = await getUser(firebaseUser.uid);
          
          // ユーザーがFirestoreに存在しない場合は作成しない（削除されたユーザーの復活を防ぐ）
          if (!user) {
            this.currentUser = null;
            resolve(null);
            unsubscribe();
            return;
          }
          
          this.currentUser = user;
          resolve(user);
        } else {
          this.currentUser = null;
          resolve(null);
        }
        
        unsubscribe();
      });
    });
  }

  // ユーザー設定を作成
  private async createUserSettings(uid: string, email: string, displayName: string): Promise<void> {
    const userSettings: UserSettings = {
      uid,
      email,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = doc(db, 'userSettings', uid);
    await setDoc(docRef, userSettings);
  }

  // サインイン
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuthInstance, email, password);
      const user = await this.getUserFromFirebase(userCredential.user);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }
      this.currentUser = user;
      return user;
    } catch (error) {
      throw new Error('ログインに失敗しました');
    }
  }

  // サインアップ
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuthInstance, email, password);
      
      // 表示名を設定
      await updateProfile(userCredential.user, { displayName });
      
      // ユーザー設定を作成
      await this.createUserSettings(userCredential.user.uid, email, displayName);
      
      // ユーザーデータを作成
      const userData = {
        username: displayName,
        email: email,
        postCount: 0,
        themeCount: 0
      };
      
      const docRef = await createUser(userData);
      const user = {
        id: docRef.id,
        ...userData,
        createdAt: new Date() as any
      };
      
      this.currentUser = user;
      return user;
    } catch (error: any) {
      // Firebaseエラーをそのまま伝播させる
      throw error;
    }
  }

  // ユーザーを完全に削除（Firestore + Firebase Auth）
  async deleteUserCompletely(userId: string): Promise<void> {
    try {
      // Firestoreのユーザーデータを削除
      await this.deleteUserFromFirestore(userId);
      
      // 現在ログインしているユーザーの場合、Firebase Authからも削除
      if (this.firebaseUser && this.firebaseUser.uid === userId) {
        await deleteFirebaseUser(this.firebaseUser);
      }
    } catch (error) {
      console.error('Error deleting user completely:', error);
      throw error;
    }
  }

  // Firestoreからユーザーを削除
  private async deleteUserFromFirestore(userId: string): Promise<void> {
    const { deleteUser, deleteUserSettings } = await import('./firestore');
    await deleteUser(userId);
    await deleteUserSettings(userId);
  }

  // サインアウト
  async signOut(): Promise<void> {
    await signOut(firebaseAuthInstance);
    this.currentUser = null;
    this.firebaseUser = null;
  }

  // Firebaseユーザーからシステムユーザーを取得
  private async getUserFromFirebase(firebaseUser: FirebaseUser): Promise<User | null> {
    return await getUser(firebaseUser.uid);
  }

  // 現在のユーザーを取得
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // 現在のFirebaseユーザーを取得
  getFirebaseUser(): FirebaseUser | null {
    return this.firebaseUser;
  }

  // 投稿数を増やす
  async incrementPostCount(userId: string): Promise<void> {
    const user = await getUser(userId);
    if (user) {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        postCount: user.postCount + 1,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  }

  // テーマ参加数を増やす
  async incrementThemeCount(userId: string): Promise<void> {
    const user = await getUser(userId);
    if (user) {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        themeCount: user.themeCount + 1,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  }
}

// 後方互換性のためのSimpleAuth（非推奨）
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
export const firebaseAuth = FirebaseAuth.getInstance();
export const auth = SimpleAuth.getInstance();
