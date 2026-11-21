export type AdminNavKey = 'overview' | 'content' | 'media' | 'albums' | 'vectorJobs' | 'chats'
  | 'competitions' | 'scoreboard';

export interface AdminNavItem {
	key: AdminNavKey;
	path: string;
}
