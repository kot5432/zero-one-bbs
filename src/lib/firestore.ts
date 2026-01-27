import { collection, addDoc, getDocs, doc, updateDoc, increment, query, orderBy, Timestamp, where, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Idea {
  id?: string;
  title: string;
  description: string;
  mode: 'online' | 'offline';
  status: 'idea' | 'preparing';
  likes: number;
  createdAt: Timestamp;
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

export async function addIdea(idea: Omit<Idea, 'id' | 'likes' | 'createdAt'>) {
  const newIdea = {
    ...idea,
    likes: 0,
    createdAt: Timestamp.now()
  };
  return await addDoc(ideasCollection, newIdea);
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
