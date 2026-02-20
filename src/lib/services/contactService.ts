import { Timestamp } from 'firebase/firestore';
import { collections } from '../firebase/collections';
import { createDocument, updateDocument, getCollection } from '../firebase/utils';
import { Contact } from '../../types';

// 一般お問い合わせサービス
export class ContactService {
  // お問い合わせ作成
  static async createContact(contactData: Omit<Contact, 'id' | 'createdAt'>) {
    const newContact = {
      ...contactData,
      createdAt: Timestamp.now()
    };
    return await createDocument(collections.contacts, newContact);
  }

  // 全お問い合わせ取得
  static async getAllContacts() {
    return await getCollection(collections.contacts);
  }

  // お問い合わせステータス更新
  static async updateContactStatus(contactId: string, status: 'pending' | 'answered' | 'closed') {
    await updateDocument('contacts', contactId, { status });
  }
}

// ビジネスお問い合わせサービス
export class BusinessContactService {
  // ビジネスお問い合わせ作成
  static async createBusinessContact(contactData: Omit<Contact, 'id' | 'createdAt'>) {
    const newContact = {
      ...contactData,
      createdAt: Timestamp.now()
    };
    return await createDocument(collections.businessContacts, newContact);
  }

  // 全ビジネスお問い合わせ取得
  static async getAllBusinessContacts() {
    return await getCollection(collections.businessContacts);
  }

  // ビジネスお問い合わせステータス更新
  static async updateBusinessContactStatus(contactId: string, status: 'pending' | 'answered' | 'closed') {
    await updateDocument('businessContacts', contactId, { status });
  }
}
