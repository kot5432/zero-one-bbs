export interface User {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  username: string;
  bio?: string;
  postCount: number;
  themeCount: number;
  createdAt: any;
  lastLoginAt?: any;
}

export interface Theme {
  id: string;
  title: string;
  description: string;
  targetMonth: string;
  startDate: any;
  endDate: any;
  isActive: boolean;
  isArchived: boolean;
  visibility: 'public' | 'private' | 'draft';
  settings: {
    allowSubmissions: boolean;
    showInList: boolean;
    allowComments: boolean;
  };
  createdAt: any;
  updatedAt: any;
}

export interface Idea {
  id?: string;
  title: string;
  description: string;
  mode: 'online' | 'offline';
  status: 'idea' | 'checked' | 'preparing' | 'event_planned' | 'rejected' | 'completed';
  likes: number;
  createdAt: any;
  updatedAt?: any;
  createdBy?: string;
  themeId?: string;
  adminMemo?: string;
  adminChecklist?: {
    safety?: boolean;
    popularity?: boolean;
    manageable?: boolean;
  };
  actionHistory?: Array<{
    action: string;
    timestamp: any;
    details?: string;
  }>;
  problem?: string;
  successCriteria?: string;
  userId?: string;
  nextAction?: string;
  rejectionReason?: string;
  eventFeasibility?: {
    likeTarget: number;
    interestedPeople: number;
    offlinePossible: boolean;
    managementEffort: 'low' | 'medium' | 'high';
    feasibilityScore: number;
  };
  relatedIdeas?: string[];
}

export interface Contact {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'answered' | 'closed';
  createdAt: any;
  updatedAt: any;
}

export interface Comment {
  id?: string;
  ideaId: string;
  text: string;
  createdAt: any;
}

export interface Like {
  id?: string;
  ideaId: string;
  userIp: string;
  createdAt: any;
}

export interface Event {
  id?: string;
  themeId: string;
  title: string;
  description: string;
  date: any;
  participantCount: number;
  content: string;
  nextActions: string[];
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'event' | 'comment' | 'participation' | 'system';
  isRead: boolean;
  createdAt: any;
  link?: string;
}

export interface AdminComment {
  id: string;
  ideaId: string;
  adminId: string;
  adminName: string;
  content: string;
  createdAt: any;
}
