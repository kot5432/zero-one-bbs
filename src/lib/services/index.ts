// サービスの統合エクスポート
export { IdeaService, CommentService } from './ideaService';
export { UserService } from './userService';
export { ThemeService, EventService } from './themeService';
export { ContactService, BusinessContactService } from './contactService';
export { NotificationService, AdminCommentService } from './notificationService';

// Firebase関連のエクスポート
export { db, auth } from '../firebase/config';
export { collections } from '../firebase/collections';
export { getUserIdentifier } from '../firebase/utils';

// 型のエクスポート
export * from '../../types';
