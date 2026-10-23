import { YearbookItem, DriveFolderInfo } from '../types/yearbook';
import firebaseConfig from '../../firebase-applet-config.json';

const CACHE_KEY = 'yearbook_cached_files_v1';

export const DEFAULT_FOLDER_ID = '1t7nywiFhuJSq97UznMrxBWOC36vG-tzZ';

/**
 * Extracts a Google Drive Folder ID from either a raw ID or a full Google Drive URL
 */
export function extractFolderId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Handle URL pattern: drive.google.com/drive/folders/{folderId}
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // Handle URL pattern: drive.google.com/open?id={folderId} or ?id={folderId}
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // Remove trailing query params or slashes if any
  return trimmed.split('?')[0].replace(/\/+$/, '');
}

/**
 * Parses academic year and numerical year for sorting from filename or creation date
 */
export function parseYearFromFilename(
  filename: string,
  createdTime?: string
): { year: number; academicYear: string } {
  const spanMatch = filename.match(/\b(19\d{2}|20\d{2})\s*[-_–/]\s*(19\d{2}|20\d{2}|\d{2})\b/);
  if (spanMatch) {
    const startYear = parseInt(spanMatch[1], 10);
    let endYearStr = spanMatch[2];
    let endYear = parseInt(endYearStr, 10);

    if (endYearStr.length === 2) {
      const century = Math.floor(startYear / 100) * 100;
      endYear = century + endYear;
    }

    return {
      year: Math.max(startYear, endYear),
      academicYear: `${startYear} – ${endYear}`,
    };
  }

  const singleYearMatch = filename.match(/\b(19\d{2}|20\d{2})\b/);
  if (singleYearMatch) {
    const year = parseInt(singleYearMatch[1], 10);
    return {
      year,
      academicYear: String(year),
    };
  }

  if (createdTime) {
    const parsedDate = new Date(createdTime);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      return {
        year,
        academicYear: String(year),
      };
    }
  }

  const fallbackYear = new Date().getFullYear();
  return {
    year: fallbackYear,
    academicYear: String(fallbackYear),
  };
}

/**
 * Cleans raw filename into a human-friendly title
 */
export function cleanTitle(filename: string): string {
  let clean = filename.replace(/\.[a-zA-Z0-9]+$/, '');
  clean = clean.replace(/[_]+/g, ' ').replace(/\s*-\s*/g, ' - ');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

/**
 * Enhances Google Drive thumbnail URL to request a high resolution preview
 */
export function getHighResThumbnail(thumbnailLink?: string): string | undefined {
  if (!thumbnailLink) return undefined;
  if (thumbnailLink.includes('=s')) {
    return thumbnailLink.replace(/=s\d+/, '=s1000');
  }
  return `${thumbnailLink}=s1000`;
}

/**
 * Loads cached yearbooks from localStorage so public viewers immediately see files
 */
export function getCachedYearbooks(): YearbookItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read yearbook cache:', err);
  }
  return [];
}

/**
 * Saves yearbook items to localStorage for persistent public viewing
 */
export function saveCachedYearbooks(items: YearbookItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(items));
    localStorage.setItem('yearbook_last_synced', new Date().toISOString());
  } catch (err) {
    console.error('Failed to save yearbook cache:', err);
  }
}

/**
 * Validates Google Drive Folder and fetches folder metadata
 */
export async function verifyDriveFolder(
  folderId: string,
  accessToken?: string | null,
  apiKey?: string
): Promise<DriveFolderInfo> {
  const cleanId = extractFolderId(folderId);
  if (!cleanId) {
    throw new Error('Please enter a valid Google Drive Folder ID');
  }

  // 1. Try public folder proxy first
  try {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const proxyRes = await fetch(`/api/drive/folder/${cleanId}`, { headers });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        id: cleanId,
        name: data.folderName || 'Google Drive Folder',
        fileCount: (data.files || []).length,
        verified: true,
      };
    }
  } catch (err) {
    console.warn('Proxy verify attempt failed, falling back to direct API:', err);
  }

  // 2. Direct API verification fallback
  const effectiveKey = apiKey || firebaseConfig.apiKey;
  let url = `https://www.googleapis.com/drive/v3/files/${cleanId}?fields=id,name,mimeType&supportsAllDrives=true`;
  const headers: Record<string, string> = {};

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (effectiveKey) {
    url += `&key=${effectiveKey}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message =
      errorJson?.error?.message ||
      `Folder access error (${res.status}). Ensure the folder exists and is shared to "Anyone with the link".`;
    throw new Error(message);
  }

  const data = await res.json();
  if (data.mimeType !== 'application/vnd.google-apps.folder') {
    throw new Error(`The provided ID belongs to a ${data.mimeType}, not a Google Drive Folder.`);
  }

  return {
    id: data.id,
    name: data.name,
    fileCount: 0,
    verified: true,
  };
}

/**
 * Fetches all files from the specified Google Drive folder
 */
export async function fetchDriveFolderFiles(
  folderId: string,
  accessToken?: string | null,
  apiKey?: string
): Promise<YearbookItem[]> {
  const cleanId = extractFolderId(folderId);
  if (!cleanId) {
    throw new Error('Folder ID is required');
  }

  // 1. First attempt: Use application backend proxy (supports public viewers with zero login)
  try {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const proxyRes = await fetch(`/api/drive/folder/${cleanId}`, { headers });
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData.success && Array.isArray(proxyData.files)) {
        const items: YearbookItem[] = proxyData.files;
        // Sort newest first
        items.sort((a, b) => b.year - a.year);
        saveCachedYearbooks(items);
        return items;
      }
    }
  } catch (proxyErr) {
    console.warn('Backend proxy fetch failed, attempting direct Google Drive API:', proxyErr);
  }

  // 2. Second attempt: Direct Google Drive v3 API (used if user has active OAuth token)
  const effectiveKey = apiKey || firebaseConfig.apiKey;
  const fields =
    'files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,createdTime,modifiedTime,size,description)';
  const query = encodeURIComponent(`'${cleanId}' in parents and trashed = false`);
  
  let url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${encodeURIComponent(
    fields
  )}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const headers: Record<string, string> = {};

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (effectiveKey) {
    url += `&key=${effectiveKey}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errorMessage =
      errData?.error?.message ||
      `Google Drive API responded with status ${response.status}. Please check permissions.`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const rawFiles: any[] = data.files || [];

  const validFiles = rawFiles.filter(
    (f) => f.mimeType !== 'application/vnd.google-apps.folder'
  );

  const items: YearbookItem[] = validFiles.map((f) => {
    const { year, academicYear } = parseYearFromFilename(f.name, f.createdTime);
    const title = cleanTitle(f.name);
    const highResThumb = getHighResThumbnail(f.thumbnailLink);

    return {
      id: f.id,
      name: f.name,
      title,
      year,
      academicYear,
      mimeType: f.mimeType,
      size: f.size ? parseInt(f.size, 10) : undefined,
      createdTime: f.createdTime,
      modifiedTime: f.modifiedTime,
      thumbnailLink: highResThumb,
      webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
      webContentLink:
        f.webContentLink || `https://drive.google.com/uc?export=download&id=${f.id}`,
      description: f.description || `Archival yearbook edition for the academic year ${academicYear}.`,
      source: 'google-drive',
    };
  });

  // Sort by year descending (newest first)
  items.sort((a, b) => b.year - a.year);

  if (items.length > 0) {
    saveCachedYearbooks(items);
  }

  return items;
}
