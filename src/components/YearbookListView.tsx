import React from 'react';
import {
  BookOpen,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
} from 'lucide-react';
import { YearbookItem } from '../types/yearbook';

interface YearbookListViewProps {
  items: YearbookItem[];
  onOpenModal: (item: YearbookItem) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export const YearbookListView: React.FC<YearbookListViewProps> = ({
  items,
  onOpenModal,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950/80 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Year & Volume
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Title & Description
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              File Name
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Size
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Added
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {items.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
              onClick={() => onOpenModal(item)}
            >
              {/* Year & Volume */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-serif-title font-bold text-xs">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    {item.academicYear}
                  </span>
                  {item.source === 'google-drive' && (
                    <span title="Synced from Google Drive">
                      <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    </span>
                  )}
                </div>
              </td>

              {/* Title & Description */}
              <td className="px-4 py-3.5">
                <div className="font-serif-title font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                  {item.title}
                </div>
                {item.description && (
                  <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {item.description}
                  </div>
                )}
              </td>

              {/* File Name */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="max-w-[200px] truncate">{item.name}</span>
                </div>
              </td>

              {/* Size */}
              <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-400 font-mono">
                {formatBytes(item.size)}
              </td>

              {/* Added */}
              <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-400">
                {formatDate(item.createdTime || item.modifiedTime)}
              </td>

              {/* Actions */}
              <td
                className="px-4 py-3.5 whitespace-nowrap text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onOpenModal(item)}
                    title="Read Yearbook"
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read</span>
                  </button>

                  {item.webContentLink && item.webContentLink !== '#' && (
                    <a
                      href={item.webContentLink}
                      download={item.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download File"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  {item.webViewLink && (
                    <a
                      href={item.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Google Drive"
                      className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
