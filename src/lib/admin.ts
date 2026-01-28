import { doc, updateDoc, serverTimestamp, deleteDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function updateIdeaStatus(ideaId: string, status: 'idea' | 'preparing' | 'event_planned' | 'rejected' | 'completed', details?: string) {
  const ideaRef = doc(db, 'ideas', ideaId);
  const ideaDoc = await getDoc(ideaRef);
  
  // 既存のアクション履歴を取得
  const existingHistory = ideaDoc.data()?.actionHistory || [];
  
  // 新しいアクション履歴を追加
  const newAction = {
    action: `status_changed_to_${status}`,
    timestamp: Timestamp.now(),
    details: details || `ステータスを${getStatusText(status)}に変更`
  };
  
  await updateDoc(ideaRef, {
    status,
    updatedAt: serverTimestamp(),
    actionHistory: [...existingHistory, newAction]
  });
}

export async function deleteIdea(ideaId: string) {
  const ideaRef = doc(db, 'ideas', ideaId);
  await deleteDoc(ideaRef);
}

export async function updateAdminMemo(ideaId: string, memo: string) {
  const ideaRef = doc(db, 'ideas', ideaId);
  await updateDoc(ideaRef, {
    adminMemo: memo,
    updatedAt: serverTimestamp()
  });
}

export async function updateAdminChecklist(ideaId: string, checklist: { safety?: boolean; popularity?: boolean; manageable?: boolean }) {
  const ideaRef = doc(db, 'ideas', ideaId);
  await updateDoc(ideaRef, {
    adminChecklist: checklist,
    updatedAt: serverTimestamp()
  });
}

function getStatusText(status: string): string {
  switch (status) {
    case 'idea': return '未確認';
    case 'preparing': return '検討中';
    case 'event_planned': return 'イベント化予定';
    case 'rejected': return '見送り';
    case 'completed': return '対応済み';
    default: return status;
  }
}
