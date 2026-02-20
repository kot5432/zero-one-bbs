import { doc, setDoc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc, serverTimestamp, increment, Timestamp } from 'firebase/firestore';
import { db } from './config';

// ドキュメント作成の共通処理
export async function createDocument(collection: any, data: any) {
  const newDoc = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  return await addDoc(collection, newDoc);
}

// ドキュメント更新の共通処理
export async function updateDocument(collectionPath: string, docId: string, data: any) {
  const docRef = doc(db, collectionPath, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

// ドキュメント削除の共通処理
export async function deleteDocument(collectionPath: string, docId: string) {
  const docRef = doc(db, collectionPath, docId);
  await deleteDoc(docRef);
}

// ドキュメント取得の共通処理
export async function getDocument(collectionPath: string, docId: string) {
  const docRef = doc(db, collectionPath, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

// コレクション全件取得の共通処理
export async function getCollection(collection: any, orderByField: string = 'createdAt', orderDirection: 'desc' | 'asc' = 'desc') {
  const q = query(collection, orderBy(orderByField, orderDirection));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
}

// 条件付きコレクション取得の共通処理
export async function getCollectionByField(collection: any, field: string, value: any, orderByField: string = 'createdAt', orderDirection: 'desc' | 'asc' = 'desc') {
  const q = query(collection, where(field, '==', value), orderBy(orderByField, orderDirection));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
}

// ユーザーIP取得のヘルパー関数
export function getUserIdentifier(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userIdentifier') || generateUserIdentifier();
  }
  return generateUserIdentifier();
}

function generateUserIdentifier(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  const identifier = `user_${timestamp}_${random}`;

  if (typeof window !== 'undefined') {
    localStorage.setItem('userIdentifier', identifier);
  }

  return identifier;
}
