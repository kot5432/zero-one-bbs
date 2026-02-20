import { increment, Timestamp, doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { collections } from '../firebase/collections';
import { createDocument, updateDocument, deleteDocument, getDocument, getCollection, getCollectionByField, getUserIdentifier } from '../firebase/utils';
import { Idea, Comment, Like } from '../../types';

// アイデア関連サービス
export class IdeaService {
  // アイデア作成
  static async createIdea(ideaData: Omit<Idea, 'id' | 'likes' | 'createdAt'>) {
    const newIdea = {
      ...ideaData,
      likes: 0,
      createdAt: Timestamp.now()
    };
    return await createDocument(collections.ideas, newIdea);
  }

  // ユーザー付きでアイデア作成
  static async createIdeaWithUser(ideaData: Omit<Idea, 'id' | 'likes' | 'createdAt'>, userId: string) {
    const newIdea = {
      ...ideaData,
      userId,
      likes: 0,
      createdAt: Timestamp.now()
    };
    return await createDocument(collections.ideas, newIdea);
  }

  // アイデア取得
  static async getIdea(ideaId: string) {
    return await getDocument('ideas', ideaId);
  }

  // 全アイデア取得
  static async getAllIdeas() {
    return await getCollection(collections.ideas);
  }

  // ユーザーのアイデア取得
  static async getUserIdeas(userId: string) {
    return await getCollectionByField(collections.ideas, 'userId', userId);
  }

  // アイデア更新
  static async updateIdea(ideaId: string, data: Partial<Idea>) {
    await updateDocument('ideas', ideaId, data);
  }

  // アイデア削除
  static async deleteIdea(ideaId: string) {
    await deleteDocument('ideas', ideaId);
  }

  // アイデアに共感
  static async likeIdea(ideaId: string) {
    const userIdentifier = getUserIdentifier();
    
    // すでに共感しているかチェック
    const existingLikes = await getCollectionByField(collections.likes, 'ideaId', ideaId);
    const alreadyLiked = existingLikes.some((like: any) => like.userIp === userIdentifier);
    
    if (alreadyLiked) {
      throw new Error('すでに共感しています');
    }

    // 共感記録を追加
    await createDocument(collections.likes, {
      ideaId,
      userIp: userIdentifier,
      createdAt: Timestamp.now()
    });

    // アイデアの共感数を増やす
    const ideaRef = doc(db, 'ideas', ideaId);
    await updateDoc(ideaRef, { likes: increment(1) });
  }

  // アイデアの共感を取り消し
  static async unlikeIdea(ideaId: string) {
    const userIdentifier = getUserIdentifier();
    
    // 共感記録を検索
    const existingLikes = await getCollectionByField(collections.likes, 'ideaId', ideaId);
    const likeRecord = existingLikes.find((like: any) => like.userIp === userIdentifier);
    
    if (!likeRecord) {
      throw new Error('共感していません');
    }

    // 共感記録を削除
    await deleteDocument('likes', likeRecord.id);

    // アイデアの共感数を減らす
    const ideaRef = doc(db, 'ideas', ideaId);
    await updateDoc(ideaRef, { likes: increment(-1) });
  }

  // ユーザーが共感したかチェック
  static async hasUserLiked(ideaId: string): Promise<boolean> {
    const userIdentifier = getUserIdentifier();
    const existingLikes = await getCollectionByField(collections.likes, 'ideaId', ideaId);
    return existingLikes.some((like: any) => like.userIp === userIdentifier);
  }

  // ユーザーが共感したアイデア取得
  static async getUserLikedIdeas(): Promise<Idea[]> {
    const userIdentifier = getUserIdentifier();
    const likedRecords = await getCollectionByField(collections.likes, 'userIp', userIdentifier);
    const likedIdeaIds = likedRecords.map((record: any) => record.ideaId);

    if (likedIdeaIds.length === 0) {
      return [];
    }

    // アイデア情報を取得
    const ideasQ = query(collection(db, 'ideas'), where('id', 'in', likedIdeaIds));
    const ideasSnapshot = await getDocs(ideasQ);
    return ideasSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Idea));
  }
}

// コメント関連サービス
export class CommentService {
  // コメント作成
  static async createComment(commentData: Omit<Comment, 'id' | 'createdAt'>) {
    const newComment = {
      ...commentData,
      createdAt: Timestamp.now()
    };
    return await createDocument(collections.comments, newComment);
  }

  // アイデアのコメント取得
  static async getIdeaComments(ideaId: string) {
    return await getCollectionByField(collections.comments, 'ideaId', ideaId);
  }
}
