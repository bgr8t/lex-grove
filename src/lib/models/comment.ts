export interface Comment {
  id?: string;
  briefId: string;
  userId: string;
  userDisplayName: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
} 