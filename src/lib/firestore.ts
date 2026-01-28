import { collection, addDoc, getDocs, doc, updateDoc, increment, query, orderBy, Timestamp, where, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export { db, Timestamp }; // dbとTimestampをエクスポート

export interface User {
  id?: string;
  username: string;
  bio?: string;
  postCount: number;
  themeCount: number;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface Theme {
  id?: string;
  title: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  eventDate?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Event {
  id?: string;
  themeId: string;
  title: string;
  description: string;
  date: Timestamp;
  participantCount: number;
  content: string;
  nextActions: string[];
  createdAt: Timestamp;
}

export interface Idea {
  id?: string;
  title: string;
  description: string;
  mode: 'online' | 'offline';
  status: 'idea' | 'preparing' | 'event_planned' | 'rejected' | 'completed';
  likes: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  adminMemo?: string;
  adminChecklist?: {
    safety?: boolean;
    popularity?: boolean;
    manageable?: boolean;
  };
  actionHistory?: Array<{
    action: string;
    timestamp: Timestamp;
    details?: string;
  }>;
  themeId?: string; // テーマとの紐付け
  problem?: string; // 何を解決したいか
  successCriteria?: string; // どんな形になれば成功か
  userId?: string; // ユーザーとの紐付け
}

export interface Comment {
  id?: string;
  ideaId: string;
  text: string;
  createdAt: Timestamp;
}

export interface Like {
  id?: string;
  ideaId: string;
  userIp: string;
  createdAt: Timestamp;
}

export const ideasCollection = collection(db, 'ideas');
export const commentsCollection = collection(db, 'comments');
export const likesCollection = collection(db, 'likes');
export const themesCollection = collection(db, 'themes');
export const eventsCollection = collection(db, 'events');
export const usersCollection = collection(db, 'users');

export async function addIdea(idea: Omit<Idea, 'id' | 'likes' | 'createdAt'>) {
  const newIdea = {
    ...idea,
    likes: 0,
    createdAt: Timestamp.now()
  };
  const result = await addDoc(ideasCollection, newIdea);
  return result;
}

// ユーザー付きでアイデアを追加
export async function addIdeaWithUser(idea: Omit<Idea, 'id' | 'likes' | 'createdAt'>, userId: string) {
  const newIdea = {
    ...idea,
    userId,
    likes: 0,
    createdAt: Timestamp.now()
  };
  const result = await addDoc(ideasCollection, newIdea);
  return result;
}

// テーマ管理関数
export async function getThemes() {
  const q = query(themesCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Theme));
}

export async function getActiveTheme() {
  const q = query(themesCollection, where('isActive', '==', true));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const theme = snapshot.docs[0];
  return { id: theme.id, ...theme.data() } as Theme;
}

export async function createTheme(theme: Omit<Theme, 'id' | 'createdAt'>) {
  const newTheme = {
    ...theme,
    createdAt: Timestamp.now()
  };
  return await addDoc(themesCollection, newTheme);
}

export async function updateTheme(themeId: string, updates: Partial<Theme>) {
  const themeRef = doc(db, 'themes', themeId);
  await updateDoc(themeRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
}

// イベント管理関数
export async function getEvents() {
  const q = query(eventsCollection, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
}

export async function createEvent(event: Omit<Event, 'id' | 'createdAt'>) {
  const newEvent = {
    ...event,
    createdAt: Timestamp.now()
  };
  return await addDoc(eventsCollection, newEvent);
}

// User管理関数
export async function getUser(userId: string) {
  const userDoc = await getDoc(doc(usersCollection, userId));
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as User : null;
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt'>) {
  const newUser = {
    ...userData,
    createdAt: Timestamp.now()
  };
  return await addDoc(usersCollection, newUser);
}

export async function updateUser(userId: string, updates: Partial<User>) {
  const userRef = doc(usersCollection, userId);
  await updateDoc(userRef, updates);
}

export async function getUserIdeas(userId: string) {
  const q = query(ideasCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
}

export async function getIdeas() {
  const q = query(ideasCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
}

export async function likeIdea(ideaId: string, userIp: string) {
  // すでに共感しているかチェック
  const q = query(likesCollection, where('ideaId', '==', ideaId), where('userIp', '==', userIp));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('すでに共感しています');
  }

  // 共感記録を追加
  await addDoc(likesCollection, {
    ideaId,
    userIp,
    createdAt: Timestamp.now()
  });

  // アイデアの共感数を増やす
  const ideaRef = doc(db, 'ideas', ideaId);
  await updateDoc(ideaRef, { likes: increment(1) });
}

export async function hasUserLiked(ideaId: string, userIp: string): Promise<boolean> {
  const q = query(likesCollection, where('ideaId', '==', ideaId), where('userIp', '==', userIp));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// ユーザーIPを取得するヘルパー関数
export function getUserIp(): string {
  // クライアントサイドでのIP取得（簡易版）
  // 本番環境ではより信頼性の高い方法を検討
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userIp') || generateUserIp();
  }
  return generateUserIp();
}

function generateUserIp(): string {
  // 簡易的なユーザー識別子（UUIDのようなもの）
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  const ip = `user_${timestamp}_${random}`;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('userIp', ip);
  }
  
  return ip;
}

export async function addComment(comment: Omit<Comment, 'id' | 'createdAt'>) {
  const newComment = {
    ...comment,
    createdAt: Timestamp.now()
  };
  return await addDoc(commentsCollection, newComment);
}

export async function getComments(ideaId: string) {
  const q = query(commentsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Comment))
    .filter(comment => comment.ideaId === ideaId);
}
