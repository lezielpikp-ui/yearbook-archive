import React from 'react';
import { BookOpen, Calendar, HardDrive, Sparkles, ExternalLink } from 'lucide-react';
import { YearbookItem, ArchiveSettings } from '../types/yearbook';

interface StatsBarProps {
  items: YearbookItem[];
  settings: ArchiveSettings;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export const StatsBar: React.FC<StatsBarProps> = ({ items, settings }) => {
  if (items.length === 0) return null;

  const years = items.map((i) => i.year).filter(Boolean);
  const minYear = years.length ? Math.min(...years) : null;
  const maxYear = years.length ? Math.max(...years) : null;
  const totalBytes = items.reduce((acc, curr) => acc + (curr.size || 0), 0);

  const driveFolderUrl = settings.folderId
    ? `https://drive.google.com/drive/folders/${settings.folderId}`
    : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
      {/* Total Volumes */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Archived Volumes
          </div>
          <div className="font-serif-title text-base sm:text-lg font-bold text-white">
            {items.length} {items.length === 1 ? 'Yearbook' : 'Yearbooks'}
          </div>
        </div>
      </div>

      {/* Timeline Span */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Chronology Span
          </div>
          <div className="font-serif-title text-base sm:text-lg font-bold text-white">
            {minYear && maxYear ? (minYear === maxYear ? `${minYear}` : `${minYear} – ${maxYear}`) : '—'}
          </div>
        </div>
      </div>

      {/* Newest Release */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Latest Edition
          </div>
          <div className="font-serif-title text-base sm:text-lg font-bold text-white">
            {maxYear || 'Current'}
          </div>
        </div>
      </div>

      {/* Google Drive Status & Link */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Archive Size
            </div>
            <div className="font-serif-title text-base sm:text-lg font-bold text-white truncate">
              {formatBytes(totalBytes)}
            </div>
          </div>
        </div>

        {driveFolderUrl && (
          <a
            href={driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open folder in Google Drive"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
