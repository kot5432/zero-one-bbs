import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function updateIdeaStatus(ideaId: string, status: 'idea' | 'preparing') {
  const ideaRef = doc(db, 'ideas', ideaId);
  await updateDoc(ideaRef, {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function deleteIdea(ideaId: string) {
  const ideaRef = doc(db, 'ideas', ideaId);
  await deleteDoc(ideaRef);
}

export async function addAdminNote(ideaId: string, note: string) {
  // TODO: 管理者メモ機能を実装
  console.log(`Add note to idea ${ideaId}: ${note}`);
}
