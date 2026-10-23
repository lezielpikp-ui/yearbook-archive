import React from 'react';
import {
  GraduationCap,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  RefreshCw,
  Settings,
  HardDrive,
  CheckCircle2,
  X,
  Calendar,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { ArchiveSettings } from '../types/yearbook';

interface HeaderProps {
  settings: ArchiveSettings;
  currentUser: User | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDecade: string;
  onDecadeChange: (d: string) => void;
  availableDecades: string[];
  sortBy: 'year-desc' | 'year-asc' | 'name-asc' | 'size-desc';
  onSortChange: (sort: 'year-desc' | 'year-asc' | 'name-asc' | 'size-desc') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (m: 'grid' | 'list') => void;
  isSyncing: boolean;
  onManualSync: () => void;
  onOpenSettings: () => void;
  lastSyncedText: string;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  searchQuery,
  onSearchChange,
  selectedDecade,
  onDecadeChange,
  availableDecades,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  isSyncing,
  onManualSync,
  onOpenSettings,
  lastSyncedText,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      {/* Top Banner: School Emblem, Title & Quick Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & School Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/40 shrink-0">
              <GraduationCap className="w-7 h-7 text-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                  {settings.schoolName || 'BINA BANGSA SCHOOL'}
                </span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <HardDrive className="w-3 h-3 text-blue-400" />
                  Google Drive Source
                </span>
              </div>
              <h1 className="font-serif-title text-xl sm:text-2xl font-bold text-white tracking-wide">
                {settings.archiveTitle || 'Yearbook Archive'}
              </h1>
            </div>
          </div>

          {/* Right Status Pill & Admin Tools */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Auto-Sync & Status Pill */}
            <div
              title={`Last synchronized: ${lastSyncedText}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline text-slate-300 font-medium text-[11px]">
                Auto-syncs 5m
              </span>
              <span className="text-slate-500 text-[10px]">•</span>
              <span className="text-[11px] text-slate-400">{lastSyncedText}</span>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              title="Sync now with Google Drive"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`}
              />
            </button>

            {/* Admin Settings Button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 text-slate-200 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Admin Settings</span>
              {settings.folderId && (
                <span className="w-2 h-2 rounded-full bg-amber-400" title="Folder connected" />
              )}
            </button>
          </div>
        </div>

        {/* Filter, Search & Layout Control Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search yearbooks by title, year (e.g., 2024), or keywords..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtering and Sort Selectors */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Decade / Era Filter */}
            {availableDecades.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => onDecadeChange('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedDecade === 'all'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Eras
                </button>
                {availableDecades.map((dec) => (
                  <button
                    key={dec}
                    onClick={() => onDecadeChange(dec)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedDecade === dec
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {dec}s
                  </button>
                ))}
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="sortSelect" className="text-[11px] text-slate-400">
                Sort:
              </label>
              <select
                id="sortSelect"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="year-desc" className="bg-slate-900 text-slate-100">
                  Year (Newest First)
                </option>
                <option value="year-asc" className="bg-slate-900 text-slate-100">
                  Year (Oldest First)
                </option>
                <option value="name-asc" className="bg-slate-900 text-slate-100">
                  Title (A – Z)
                </option>
                <option value="size-desc" className="bg-slate-900 text-slate-100">
                  File Size (Largest)
                </option>
              </select>
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => onViewModeChange('grid')}
                title="Grid view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                title="Table list view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
