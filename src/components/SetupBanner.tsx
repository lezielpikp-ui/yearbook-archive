import React from 'react';
import { HardDrive, Settings, Sparkles, FolderSync, ArrowRight, ShieldCheck } from 'lucide-react';

interface SetupBannerProps {
  hasFolderId: boolean;
  itemCount: number;
  onOpenSettings: () => void;
}

export const SetupBanner: React.FC<SetupBannerProps> = ({
  hasFolderId,
  itemCount,
  onOpenSettings,
}) => {
  if (hasFolderId) return null;

  return (
    <div className="relative overflow-hidden my-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Archive Demonstration Mode</span>
          </div>

          <h2 className="font-serif-title text-lg sm:text-xl font-bold text-white">
            Connect Your School Google Drive Folder
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You are currently exploring high-resolution sample yearbooks. To display your school&apos;s real archive, paste your Google Drive Folder ID in Admin Settings. Files you upload to Drive will automatically appear here for anyone to browse without login.
          </p>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl transition-all hover:scale-105 shrink-0 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-950" />
          <span>Enter Folder ID</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Decorative highlight */}
      <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};
