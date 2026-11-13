export type GameStatus = 'setup' | 'active' | 'ended';
export type SubmissionStatus = 'unmarked' | 'approved' | 'rejected';
export type MediaType = 'image' | 'video';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface GameState {
  title: string;
  status: GameStatus;
  adminToken: string;
  durationMinutes: number;
  startedAt: number | null;
  endsAt: number | null;
  endedAt: number | null;
  ntfyTopic: string;
  rulesText: string;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Task {
  id: string;
  number: number;
  title: string;
  description: string;
  categoryId: string;
  points: number;
  imageUrl?: string;
  imagePath?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TeamAdjustment {
  id: string;
  delta: number;
  reason: string;
  createdAt: number;
}

export interface Team {
  id: string;
  number: number;
  name: string;
  color: string;
  accessToken: string;
  penaltyPoints: number;
  adjustments: TeamAdjustment[];
  createdAt: number;
}

export interface Submission {
  id: string; // `${teamId}_${taskId}`
  teamId: string;
  taskId: string;
  taskNumber: number;
  taskTitle: string;
  categoryId: string;
  teamName: string;
  teamNumber: number;
  teamColor: string;
  mediaUrl: string;
  mediaPath: string;
  mediaType: MediaType;
  status: SubmissionStatus;
  basePoints: number;
  bonusPoints: number;
  awardedPoints: number;
  adminNote?: string;
  submittedAt: number;
  gradedAt: number | null;
}

export interface TeamScoreSummary {
  team: Team;
  basePoints: number;
  bonusPoints: number;
  adjustments: number;
  totalScore: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}
