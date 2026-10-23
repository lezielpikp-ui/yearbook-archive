import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Helper to parse academic year from filename
function parseYear(filename: string): { year: number; academicYear: string } {
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

  const currentYear = new Date().getFullYear();
  return {
    year: currentYear,
    academicYear: String(currentYear),
  };
}

function cleanTitle(filename: string): string {
  let clean = filename.replace(/\.[a-zA-Z0-9]+$/, '');
  clean = clean.replace(/[_]+/g, ' ').replace(/\s*-\s*/g, ' - ');
  return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Public Google Drive Folder Endpoint (No login required for viewers)
 * Also supports Bearer token if admin is logged in.
 */
app.get('/api/drive/folder/:folderId', async (req: Request, res: Response) => {
  const folderId = req.params.folderId;
  const authToken = req.headers.authorization;

  if (!folderId) {
    return res.status(400).json({ error: 'Folder ID is required' });
  }

  // 1. If admin is signed in with Bearer token, query Google Drive API v3 directly
  if (authToken && authToken.startsWith('Bearer ')) {
    try {
      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const fields = encodeURIComponent(
        'files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,createdTime,modifiedTime,size,description)'
      );
      const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;

      const response = await fetch(apiUrl, {
        headers: { Authorization: authToken },
      });

      if (response.ok) {
        const data = await response.json();
        const rawFiles = (data.files || []).filter(
          (f: any) => f.mimeType !== 'application/vnd.google-apps.folder'
        );

        const items = rawFiles.map((f: any) => {
          const { year, academicYear } = parseYear(f.name);
          return {
            id: f.id,
            name: f.name,
            title: cleanTitle(f.name),
            year,
            academicYear,
            mimeType: f.mimeType || 'application/pdf',
            size: f.size ? parseInt(f.size, 10) : undefined,
            createdTime: f.createdTime,
            modifiedTime: f.modifiedTime,
            thumbnailLink: f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+/, '=s1000') : undefined,
            webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
            webContentLink: f.webContentLink || `https://drive.google.com/uc?export=download&id=${f.id}`,
            description: f.description || `Archival yearbook edition for the academic year ${academicYear}.`,
            source: 'google-drive',
          };
        });

        items.sort((a: any, b: any) => b.year - a.year);
        return res.json({ success: true, folderName: 'Google Drive Archive', files: items });
      }
    } catch (e) {
      console.warn('Bearer auth fetch failed, falling back to public embedded folderview:', e);
    }
  }

  // 2. Public folder retrieval (No login required for viewers)
  try {
    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
    const embedRes = await fetch(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!embedRes.ok) {
      return res.status(embedRes.status).json({
        error: `Unable to access Google Drive folder (${embedRes.status}). Verify it is shared to "Anyone with the link".`,
      });
    }

    const html = await embedRes.text();

    // Extract folder title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const folderName = titleMatch ? titleMatch[1].trim() : 'Yearbook Archive';

    // Parse each entry in the embedded view
    const items: any[] = [];
    // Matches entry divs: id="entry-1SpR53qUyj5hIcUeaxez8tJxT-o4navkU"
    const entryRegex = /id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>[\s\S]*?(?:<div class="flip-entry-last-modified"><div>([^<]*)<\/div><\/div>)?/g;

    let match;
    while ((match = entryRegex.exec(html)) !== null) {
      const fileId = match[1];
      const filename = match[2].trim();
      const lastModified = match[3] ? match[3].trim() : undefined;

      // Extract thumbnail if available in entry
      const entrySubstr = html.substring(match.index, match.index + match[0].length + 400);
      const thumbMatch = entrySubstr.match(/<div class="flip-entry-thumb"><img src="([^"]+)"/);
      let thumbnailLink: string | undefined = undefined;
      if (thumbMatch && thumbMatch[1]) {
        // High-res version of Google user content thumbnail
        thumbnailLink = thumbMatch[1].replace(/=s\d+/, '=s1000').replace(/&amp;/g, '&');
      } else {
        thumbnailLink = `https://lh3.googleusercontent.com/d/${fileId}=w1000-h1400`;
      }

      const { year, academicYear } = parseYear(filename);

      items.push({
        id: fileId,
        name: filename,
        title: cleanTitle(filename),
        year,
        academicYear,
        mimeType: filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
        size: undefined,
        modifiedTime: lastModified,
        thumbnailLink,
        webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
        webContentLink: `https://drive.google.com/uc?export=download&id=${fileId}`,
        description: `Archival yearbook edition for the academic year ${academicYear}.`,
        source: 'google-drive',
      });
    }

    // Sort newest first
    items.sort((a, b) => b.year - a.year);

    return res.json({
      success: true,
      folderName,
      files: items,
    });
  } catch (error: any) {
    console.error('Error fetching public folder:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch files from Google Drive folder',
    });
  }
});

// Configure Vite middleware in development or serve static in production
if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Yearbook Archive Server running on port ${PORT}`);
});
