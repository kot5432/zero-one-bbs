// 互換性のためのエクスポート
// 新しいサービスクラスを使用することを推奨

import { Timestamp } from 'firebase/firestore';
import { db } from './firebase/config';
import { getUserIdentifier } from './firebase/utils';

export { 
  db, 
  // サービスクラス
  IdeaService,
  CommentService,
  UserService,
  ThemeService,
  EventService,
  ContactService,
  BusinessContactService,
  NotificationService,
  AdminCommentService,
  // コレクション
  collections
} from './services';

// 型定義
export * from '../types';

// レガシー関数（互換性のため）
import { IdeaService, CommentService, UserService, ThemeService, EventService, ContactService, BusinessContactService } from './services';

// アイデア関連
export const addIdea = IdeaService.createIdea;
export const addIdeaWithUser = IdeaService.createIdeaWithUser;
export const getIdeas = IdeaService.getAllIdeas;
export const updateIdea = IdeaService.updateIdea;
export const deleteIdea = IdeaService.deleteIdea;
export const likeIdea = IdeaService.likeIdea;
export const unlikeIdea = IdeaService.unlikeIdea;
export const hasUserLiked = IdeaService.hasUserLiked;
export const getUserLikedIdeas = IdeaService.getUserLikedIdeas;
export const addComment = CommentService.createComment;
export const getComments = CommentService.getIdeaComments;

// ユーザー関連
export const getUser = UserService.getUser;
export const createUser = UserService.createUser;
export const updateUser = UserService.updateUser;
export const getAllUsers = UserService.getAllUsers;
export const deleteUser = UserService.deleteUser;
export const getUserSettings = UserService.getUserSettings;
export const getAllUserSettings = UserService.getAllUserSettings;
export const deleteUserSettings = UserService.deleteUserSettings;
export const logDeletion = UserService.logDeletion;
export const getAllDeletionLogs = UserService.getAllDeletionLogs;

// テーマ関連
export const getThemes = ThemeService.getAllThemes;
export const getActiveTheme = ThemeService.getActiveTheme;
export const createTheme = ThemeService.createTheme;
export const updateTheme = ThemeService.updateTheme;
export const deleteTheme = ThemeService.deleteTheme;
export const addTheme = ThemeService.createTheme; // 重複関数の統合

// イベント関連
export const getEvents = EventService.getAllEvents;
export const createEvent = EventService.createEvent;

// お問い合わせ関連
export const getContacts = ContactService.getAllContacts;
export const updateContactStatus = ContactService.updateContactStatus;
export const getBusinessContacts = BusinessContactService.getAllBusinessContacts;
export const updateBusinessContactStatus = BusinessContactService.updateBusinessContactStatus;

// ユーティリティ
export const getUserIp = getUserIdentifier; // 名前の統一
