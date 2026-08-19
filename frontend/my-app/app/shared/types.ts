export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen?: Date;
};

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'video' | 'document' | 'audio';

export type Message = {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  content: string; // Text or media URL
  mediaMeta?: { duration?: number; size?: number; fileName?: string };
  status: MessageStatus;
  timestamp: Date;
  replyTo?: string; // Message ID
  reactions?: Record<string, string>; // userId -> emoji
};

export type ChatRoom = {
  id: string;
  isGroup: boolean;
  name?: string; // Required if isGroup
  avatarUrl?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
};

export type CallType = 'audio' | 'video';
export type CallState = 'idle' | 'ringing' | 'connected' | 'ended';

export type StatusUpdate = {
  id: string;
  userId: string;
  mediaUrl: string;
  type: 'image' | 'text' | 'video';
  expiresAt: Date;
};
