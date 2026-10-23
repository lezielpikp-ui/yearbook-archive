import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Share2,
  Calendar,
  FileText,
  Check,
} from 'lucide-react';
import { YearbookItem } from '../types/yearbook';
import { YearbookCoverFallback } from './YearbookCoverFallback';

interface YearbookModalProps {
  item: YearbookItem | null;
  allItems: YearbookItem[];
  schoolName: string;
  onClose: () => void;
  onSelect: (item: YearbookItem) => void;
}

export const YearbookModal: React.FC<YearbookModalProps> = ({
  item,
  allItems,
  schoolName,
  onClose,
  onSelect,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close on Escape key and navigate with Left/Right keys
  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, allItems]);

  if (!item) return null;

  const currentIndex = allItems.findIndex((i) => i.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allItems.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onSelect(allItems[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelect(allItems[currentIndex + 1]);
    }
  };

  const handleCopyLink = () => {
    const url = item.webViewLink || window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isGoogleDriveFile = item.source === 'google-drive';
  const previewUrl = isGoogleDriveFile
    ? `https://drive.google.com/file/d/${item.id}/preview`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div
        className={`relative flex flex-col w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'h-full max-w-full' : 'h-[92vh] max-w-6xl'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-950/90 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-serif-title font-bold text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {item.academicYear}
            </span>

            <div className="min-w-0">
              <h2 className="font-serif-title text-base sm:text-lg font-bold text-white truncate">
                {item.title}
              </h2>
              <p className="font-mono text-[11px] text-slate-400 truncate flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                {item.name}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Share / Copy link */}
            <button
              onClick={handleCopyLink}
              title="Copy share link"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Download */}
            {item.webContentLink && item.webContentLink !== '#' && (
              <a
                href={item.webContentLink}
                download={item.name}
                target="_blank"
                rel="noopener noreferrer"
                title="Download file"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                title="Open directly in Google Drive"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Drive</span>
              </a>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close viewer (Esc)"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-950/50 hover:text-rose-400 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Body / Content View */}
        <div className="relative flex-grow bg-slate-950 overflow-hidden flex items-center justify-center">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title={item.title}
              className="w-full h-full border-0 bg-slate-950"
              allow="autoplay"
            />
          ) : (
            /* Fallback for sample file preview */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
              <div className="max-w-md w-full aspect-[3/4] max-h-[500px] mb-4 shadow-2xl rounded-lg overflow-hidden border border-slate-700">
                {item.thumbnailLink ? (
                  <img
                    src={item.thumbnailLink}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <YearbookCoverFallback
                    title={item.title}
                    year={item.year}
                    academicYear={item.academicYear}
                    schoolName={schoolName}
                  />
                )}
              </div>

              <div className="max-w-xl">
                <h3 className="font-serif-title text-xl font-bold text-slate-100 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{item.description}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    Sample Archive Record
                  </span>
                  {item.webViewLink && (
                    <a
                      href={item.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View High-Res Photo
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Previous Yearbook Floating Button */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              title={`Previous: ${allItems[currentIndex - 1].academicYear}`}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl backdrop-blur-md transition-transform hover:scale-110 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Next Yearbook Floating Button */}
          {hasNext && (
            <button
              onClick={handleNext}
              title={`Next: ${allItems[currentIndex + 1].academicYear}`}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl backdrop-blur-md transition-transform hover:scale-110 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">
              Edition {currentIndex + 1} of {allItems.length}
            </span>
            <span className="text-slate-600">•</span>
            <span>Use ← / → keys to navigate</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Official School Repository</span>
          </div>
        </div>
      </div>
    </div>
  );
};
