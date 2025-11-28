export type AdminNavKey = 'overview' | 'content' | 'media' | 'albums' | 'vectorJobs' | 'chats';

export interface AdminNavItem {
	key: AdminNavKey;
	path: string;
}
