import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Calendar,
  HardDrive,
  Eye,
} from 'lucide-react';
import { YearbookItem } from '../types/yearbook';
import { YearbookCoverFallback } from './YearbookCoverFallback';

interface YearbookCardProps {
  item: YearbookItem;
  schoolName: string;
  onOpenModal: (item: YearbookItem) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Document';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export const YearbookCard: React.FC<YearbookCardProps> = ({
  item,
  schoolName,
  onOpenModal,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className="group relative flex flex-col bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300"
    >
      {/* Top Cover Thumbnail Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {/* If image is available and hasn't errored */}
        {item.thumbnailLink && !imageError ? (
          <>
            <img
              src={item.thumbnailLink}
              alt={item.name}
              referrerPolicy="no-referrer"
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {!imageLoaded && (
              <div className="absolute inset-0">
                <YearbookCoverFallback
                  title={item.title}
                  year={item.year}
                  academicYear={item.academicYear}
                  schoolName={schoolName}
                />
              </div>
            )}
          </>
        ) : (
          <YearbookCoverFallback
            title={item.title}
            year={item.year}
            academicYear={item.academicYear}
            schoolName={schoolName}
          />
        )}

        {/* Overlay gradient for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/30 pointer-events-none" />

        {/* Year Pill (Top Left) */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-amber-400/40 text-amber-300 font-serif-title font-bold text-xs shadow-md tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            {item.academicYear}
          </span>
        </div>

        {/* Source Badge (Top Right) */}
        <div className="absolute top-3 right-3 z-10">
          {item.source === 'google-drive' ? (
            <span
              title="Synced from Google Drive"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/80 backdrop-blur-md border border-blue-500/30 text-blue-300 text-[10px] font-medium"
            >
              <HardDrive className="w-3 h-3 text-blue-400" />
              Drive
            </span>
          ) : (
            <span
              title="Archival Preview Edition"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-700 text-slate-300 text-[10px] font-medium"
            >
              Archive
            </span>
          )}
        </div>

        {/* Quick Read Floating Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950/60 backdrop-blur-[2px]">
          <button
            onClick={() => onOpenModal(item)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-950" />
            <span>Open & Read</span>
          </button>
        </div>
      </div>

      {/* Card Content & Details */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
        <div>
          {/* Title */}
          <h3
            onClick={() => onOpenModal(item)}
            className="font-serif-title text-base font-bold text-slate-100 hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer"
            title={item.title}
          >
            {item.title}
          </h3>

          {/* Original Filename */}
          <div
            className="flex items-center gap-1.5 text-xs text-slate-400 mt-1"
            title={item.name}
          >
            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-mono text-[11px] truncate">{item.name}</span>
          </div>

          {/* Description snippet if any */}
          {item.description && (
            <p className="text-xs text-slate-400/90 mt-2 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Footer with size, format & action buttons */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-mono text-slate-300">
              {item.mimeType.includes('pdf') ? 'PDF' : 'DOC'}
            </span>
            <span className="text-[11px] text-slate-400">{formatBytes(item.size)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Direct Download Button */}
            {item.webContentLink && item.webContentLink !== '#' && (
              <a
                href={item.webContentLink}
                download={item.name}
                target="_blank"
                rel="noopener noreferrer"
                title="Download original file"
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            {/* Google Drive Link */}
            {item.webViewLink && (
              <a
                href={item.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Google Drive"
                className="p-1.5 rounded-md text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* In-app Reader button */}
            <button
              onClick={() => onOpenModal(item)}
              title="Read yearbook in viewer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
