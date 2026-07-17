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
  messages: EmailLog[];
}

export interface EmailLog {
	id: string;
	from: { address: string; name: string } | string;
	to: { address: string; name: string }[] | string;
	subject: string;
	html: string;
	text: string;
	date: string;
} 