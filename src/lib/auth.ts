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
          // ユーザー設定を取得
          let user = await getUser(firebaseUser.uid);
          
          // ユーザーがFirestoreに存在しない場合は作成（新規ユーザーの場合）
          if (!user) {
            console.log('User not found in Firestore, Firebase user:', firebaseUser.uid);
            this.currentUser = null;
            resolve(null);
            unsubscribe();
            return;
          }
          
          this.currentUser = user;
          console.log('User found and set:', user);
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
      console.log('FirebaseAuth: Attempting sign in for email:', email);
      const userCredential = await signInWithEmailAndPassword(firebaseAuthInstance, email, password);
      console.log('FirebaseAuth: Firebase sign in successful, UID:', userCredential.user.uid);
      
      const user = await this.getUserFromFirebase(userCredential.user);
      console.log('FirebaseAuth: User from Firestore:', user);
      
      if (!user) {
        console.error('FirebaseAuth: User not found in Firestore for UID:', userCredential.user.uid);
        throw new Error('ユーザーが見つかりません');
      }
      
      this.currentUser = user;
      console.log('FirebaseAuth: Sign in completed successfully');
      return user;
    } catch (error: any) {
      console.error('FirebaseAuth: Sign in error:', error);
      console.error('FirebaseAuth: Error code:', error.code);
      console.error('FirebaseAuth: Error message:', error.message);
      // Firebaseエラーをそのまま伝播させる
      throw error;
    }
  }

  // サインアップ
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      console.log('FirebaseAuth: Attempting sign up for email:', email);
      const userCredential = await createUserWithEmailAndPassword(firebaseAuthInstance, email, password);
      console.log('FirebaseAuth: Firebase sign up successful, UID:', userCredential.user.uid);
      
      // 表示名を設定
      await updateProfile(userCredential.user, { displayName });
      console.log('FirebaseAuth: Profile updated with display name:', displayName);
      
      // ユーザー設定を作成
      await this.createUserSettings(userCredential.user.uid, email, displayName);
      console.log('FirebaseAuth: User settings created');
      
      // ユーザーデータを作成
      const userData = {
        username: displayName,
        email: email,
        postCount: 0,
        themeCount: 0
      };
      
      // Firebase UIDをドキュメントIDとして使用
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        ...userData,
        createdAt: serverTimestamp()
      });
      console.log('FirebaseAuth: User document created with Firebase UID:', userCredential.user.uid);
      
      // 作成したユーザーデータを取得
      const user = await getUser(userCredential.user.uid);
      console.log('FirebaseAuth: Retrieved user from Firestore:', user);
      
      if (!user) {
        throw new Error('ユーザーデータの作成に失敗しました');
      }
      
      // 現在のユーザーを設定
      this.currentUser = user;
      this.firebaseUser = userCredential.user;
      
      console.log('FirebaseAuth: Sign up completed successfully');
      return user;
    } catch (error: any) {
      console.error('FirebaseAuth: Sign up error:', error);
      console.error('FirebaseAuth: Error code:', error.code);
      console.error('FirebaseAuth: Error message:', error.message);
      // Firebaseエラーをそのまま伝播させる
      throw error;
    }
  }

  // ユーザーを完全に削除（Firestore + Firebase Auth）
  async deleteUserCompletely(userId: string): Promise<void> {
    try {
      console.log('Starting complete user deletion for:', userId);
      
      // Firestoreのユーザーデータを削除
      await this.deleteUserFromFirestore(userId);
      console.log('Firestore data deleted successfully');
      
      // 現在ログインしているユーザーの場合、Firebase Authからも削除
      if (this.firebaseUser && this.firebaseUser.uid === userId) {
        console.log('Deleting Firebase Auth user:', this.firebaseUser.uid);
        await deleteFirebaseUser(this.firebaseUser);
        console.log('Firebase Auth user deleted successfully');
        
        // 現在のユーザー状態をクリア
        this.currentUser = null;
        this.firebaseUser = null;
      } else {
        console.log('User not logged in or UID mismatch');
        throw new Error('ログインしているユーザーと削除対象のユーザーが一致しません');
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
    try {
      console.log('FirebaseAuth: Getting user from Firestore for UID:', firebaseUser.uid);
      const user = await getUser(firebaseUser.uid);
      console.log('FirebaseAuth: getUser result:', user);
      return user;
    } catch (error) {
      console.error('FirebaseAuth: Error getting user from Firebase:', error);
      return null;
    }
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
        uid: userId,
        email: '',
        displayName: username || `ユーザー${userId.substring(0, 6)}`,
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
