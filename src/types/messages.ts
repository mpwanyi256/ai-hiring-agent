export interface MessageSender {
  id: string;
  name: string;
  email: string;
  role: string;
  isCurrentUser: boolean;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export interface MessageReplyTo {
  id: string;
  text: string;
  sender: {
    name: string;
  };
}

export interface MessageAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: string;
  reactions: MessageReaction[];
  replyTo?: MessageReplyTo;
  attachment?: MessageAttachment;
  isEdited: boolean;
  editedAt?: string;
  status?: string; // Optional status property for message delivery status
}

export interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}
