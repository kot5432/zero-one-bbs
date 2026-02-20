import { Timestamp } from 'firebase/firestore';
import { collections } from '../firebase/collections';
import { createDocument, updateDocument, deleteDocument, getDocument, getCollection, getCollectionByField } from '../firebase/utils';
import { Theme, Event } from '../../types';

// テーマ関連サービス
export class ThemeService {
  // テーマ作成
  static async createTheme(themeData: Omit<Theme, 'id' | 'createdAt'>) {
    const newTheme = {
      ...themeData,
      createdAt: Timestamp.now()
    };
    return await createDocument(collections.themes, newTheme);
  }

  // テーマ取得
  static async getTheme(themeId: string) {
    return await getDocument('themes', themeId);
  }

  // 全テーマ取得
  static async getAllThemes() {
    return await getCollection(collections.themes);
  }

  // アクティブなテーマ取得
  static async getActiveTheme() {
    const activeThemes = await getCollectionByField(collections.themes, 'isActive', true);
    return activeThemes.length > 0 ? activeThemes[0] : null;
  }

  // テーマ更新
  static async updateTheme(themeId: string, data: Partial<Theme>) {
    await updateDocument('themes', themeId, data);
  }

  // テーマ削除
  static async deleteTheme(themeId: string) {
    await deleteDocument('themes', themeId);
  }
}

// イベント関連サービス
export class EventService {
  // イベント作成
  static async createEvent(eventData: Omit<Event, 'id' | 'createdAt'>) {
    const newEvent = {
      ...eventData,
      createdAt: Timestamp.now()
    };
    return await createDocument(collections.events, newEvent);
  }

  // イベント取得
  static async getEvent(eventId: string) {
    return await getDocument('events', eventId);
  }

  // 全イベント取得
  static async getAllEvents() {
    return await getCollection(collections.events);
  }

  // テーマ関連イベント取得
  static async getThemeEvents(themeId: string) {
    return await getCollectionByField(collections.events, 'themeId', themeId);
  }

  // イベント更新
  static async updateEvent(eventId: string, data: Partial<Event>) {
    await updateDocument('events', eventId, data);
  }

  // イベント削除
  static async deleteEvent(eventId: string) {
    await deleteDocument('events', eventId);
  }
}
