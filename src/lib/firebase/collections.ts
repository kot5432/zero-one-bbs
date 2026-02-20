import { collection } from 'firebase/firestore';
import { db } from './config';

export const collections = {
  ideas: collection(db, 'ideas'),
  comments: collection(db, 'comments'),
  likes: collection(db, 'likes'),
  themes: collection(db, 'themes'),
  events: collection(db, 'events'),
  users: collection(db, 'users'),
  contacts: collection(db, 'contacts'),
  businessContacts: collection(db, 'businessContacts'),
  userSettings: collection(db, 'userSettings'),
  notifications: collection(db, 'notifications'),
  adminComments: collection(db, 'adminComments'),
  deletionLogs: collection(db, 'deletionLogs'),
} as const;
