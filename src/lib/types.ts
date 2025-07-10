export interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface TempEmail {
  id: string;
  address: string;
  prefix: string;
  createdAt: Date;
  messages: EmailMessage[];
}

export interface EmailLog {
  datetime: string;
  id: string;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  status: string;
  action: string;
} 