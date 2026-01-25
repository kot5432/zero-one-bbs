import { collection, addDoc, getDocs, doc, updateDoc, increment, query, orderBy, Timestamp } from 'firebase/firestore';
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

export const ideasCollection = collection(db, 'ideas');
export const commentsCollection = collection(db, 'comments');

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

export async function likeIdea(ideaId: string) {
  const ideaRef = doc(db, 'ideas', ideaId);
  await updateDoc(ideaRef, { likes: increment(1) });
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
