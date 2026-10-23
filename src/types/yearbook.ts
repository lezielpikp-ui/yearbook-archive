export interface YearbookItem {
  id: string;
  name: string;
  title: string;
  year: number;
  academicYear: string;
  mimeType: string;
  size?: number;
  createdTime?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  description?: string;
  source: 'google-drive' | 'sample';
}

export interface ArchiveSettings {
  folderId: string;
  apiKey: string;
  schoolName: string;
  archiveTitle: string;
  lastSynced: string | null;
  autoSyncEnabled: boolean;
  viewMode: 'grid' | 'list';
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  fileCount: number;
  verified: boolean;
}
