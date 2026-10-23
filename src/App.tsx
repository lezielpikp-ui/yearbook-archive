/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  BookOpen,
  Search,
  HardDrive,
  RefreshCw,
  FolderOpen,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

import { YearbookItem, ArchiveSettings } from './types/yearbook';
import {
  fetchDriveFolderFiles,
  getCachedYearbooks,
  saveCachedYearbooks,
  DEFAULT_FOLDER_ID,
} from './services/driveApi';
import { SAMPLE_YEARBOOKS } from './services/sampleData';
import { initAuth, getAccessToken } from './services/firebaseAuth';
import firebaseConfig from '../firebase-applet-config.json';

import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { SetupBanner } from './components/SetupBanner';
import { YearbookCard } from './components/YearbookCard';
import { YearbookListView } from './components/YearbookListView';
import { YearbookModal } from './components/YearbookModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';

const SETTINGS_KEY = 'yearbook_archive_settings_v1';
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function App() {
  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState<ArchiveSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.folderId) {
          parsed.folderId = DEFAULT_FOLDER_ID;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return {
      folderId: DEFAULT_FOLDER_ID,
      apiKey: firebaseConfig.apiKey || '',
      schoolName: 'BINA BANGSA SCHOOL',
      archiveTitle: 'Yearbook Archive',
      lastSynced: null,
      autoSyncEnabled: true,
      viewMode: 'grid',
    };
  });

  // Items in repository
  const [items, setItems] = useState<YearbookItem[]>(() => {
    const cached = getCachedYearbooks();
    return cached.length > 0 ? cached : SAMPLE_YEARBOOKS;
  });

  // Current admin user if signed in
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // UI state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDecade, setSelectedDecade] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'year-desc' | 'year-asc' | 'name-asc' | 'size-desc'>('year-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(settings.viewMode || 'grid');

  // Modals
  const [activeModalItem, setActiveModalItem] = useState<YearbookItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(() => {
    const raw = localStorage.getItem('yearbook_last_synced');
    return raw ? new Date(raw) : null;
  });

  // 1. Initialize Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2. Synchronize folder files from Google Drive
  const syncArchive = useCallback(async () => {
    if (!settings.folderId) {
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const token = await getAccessToken();
      const files = await fetchDriveFolderFiles(
        settings.folderId,
        token,
        settings.apiKey
      );

      if (files.length > 0) {
        setItems(files);
      } else {
        // If folder is empty, warn but keep cache
        setSyncError('Google Drive folder is empty. Upload yearbook PDFs to see them here.');
      }

      const now = new Date();
      setLastSyncedTime(now);
      setSettings((prev) => {
        const updated = { ...prev, lastSynced: now.toISOString() };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncError(
        err.message || 'Unable to sync with Google Drive. Verify folder sharing permissions.'
      );
    } finally {
      setIsSyncing(false);
    }
  }, [settings.folderId, settings.apiKey]);

  // 3. Initial sync on mount if folderId is configured
  useEffect(() => {
    if (settings.folderId) {
      syncArchive();
    }
  }, [settings.folderId, syncArchive]);

  // 4. Auto-refresh every 5 minutes as required
  useEffect(() => {
    if (!settings.folderId) return;

    const intervalId = setInterval(() => {
      console.log('Running scheduled 5-minute auto-refresh...');
      syncArchive();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [settings.folderId, syncArchive]);

  // 5. Update settings helper
  const handleSaveSettings = (newSettings: ArchiveSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleLoadSamples = () => {
    setItems(SAMPLE_YEARBOOKS);
    saveCachedYearbooks(SAMPLE_YEARBOOKS);
    setSyncError(null);
  };

  // Compute available decades for filtering
  const availableDecades = useMemo(() => {
    const decadesSet = new Set<string>();
    items.forEach((item) => {
      if (item.year) {
        const decade = `${Math.floor(item.year / 10) * 10}`;
        decadesSet.add(decade);
      }
    });
    return Array.from(decadesSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }, [items]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.academicYear.toLowerCase().includes(q) ||
          String(item.year).includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    // Filter by decade
    if (selectedDecade !== 'all') {
      const decadeNum = parseInt(selectedDecade, 10);
      result = result.filter(
        (item) => item.year >= decadeNum && item.year < decadeNum + 10
      );
    }

    // Sort items
    result.sort((a, b) => {
      switch (sortBy) {
        case 'year-desc':
          return b.year - a.year; // Newest first (default)
        case 'year-asc':
          return a.year - b.year; // Oldest first
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'size-desc':
          return (b.size || 0) - (a.size || 0);
        default:
          return b.year - a.year;
      }
    });

    return result;
  }, [items, searchQuery, selectedDecade, sortBy]);

  // Format relative last synced text
  const lastSyncedText = useMemo(() => {
    if (!lastSyncedTime) return 'Never synced';
    const seconds = Math.floor((new Date().getTime() - lastSyncedTime.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [lastSyncedTime]);

  return (
    <div className="min-h-screen bg-[#0c121e] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        settings={settings}
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDecade={selectedDecade}
        onDecadeChange={setSelectedDecade}
        availableDecades={availableDecades}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setSettings((prev) => ({ ...prev, viewMode: mode }));
        }}
        isSyncing={isSyncing}
        onManualSync={syncArchive}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lastSyncedText={lastSyncedText}
      />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Setup banner if folder is not configured yet */}
        <SetupBanner
          hasFolderId={!!settings.folderId}
          itemCount={items.length}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Sync Error Banner if any */}
        {syncError && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{syncError}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* Quick Archival Statistics */}
        <StatsBar items={items} settings={settings} />

        {/* Content Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-6 bg-amber-500 rounded-full" />
            <h2 className="font-serif-title text-xl font-bold text-white tracking-wide">
              {selectedDecade === 'all'
                ? 'Chronological Archives'
                : `${selectedDecade}s Collection`}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'Volume' : 'Volumes'}
            </span>
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              Clear search filter
            </button>
          )}
        </div>

        {/* Grid or List View */}
        {filteredAndSortedItems.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAndSortedItems.map((item) => (
                <YearbookCard
                  key={item.id}
                  item={item}
                  schoolName={settings.schoolName}
                  onOpenModal={(selected) => setActiveModalItem(selected)}
                />
              ))}
            </div>
          ) : (
            <YearbookListView
              items={filteredAndSortedItems}
              onOpenModal={(selected) => setActiveModalItem(selected)}
            />
          )
        ) : (
          /* Empty State */
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif-title text-lg font-bold text-white">
                No yearbooks found
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                No archived yearbooks matched your query &ldquo;{searchQuery}&rdquo;.
                Try searching for a different year or keyword.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDecade('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Collegiate Footer */}
      <footer className="mt-16 bg-slate-950 border-t border-slate-800/80 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span className="font-serif-title font-bold text-slate-200 tracking-wider">
              {settings.schoolName}
            </span>
          </div>
          <p className="text-slate-500">
            Public Digital Archival Repository • Integrated with Google Drive API
          </p>
          <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-slate-400">
            <span>Automatic Sync Enabled (5m)</span>
            <span>•</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-amber-400 underline cursor-pointer"
            >
              Admin Settings
            </button>
            {settings.folderId && (
              <>
                <span>•</span>
                <a
                  href={`https://drive.google.com/drive/folders/${settings.folderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 inline-flex items-center gap-1"
                >
                  <span>Google Drive Folder</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Reader Modal */}
      {activeModalItem && (
        <YearbookModal
          item={activeModalItem}
          allItems={filteredAndSortedItems}
          schoolName={settings.schoolName}
          onClose={() => setActiveModalItem(null)}
          onSelect={(newItem) => setActiveModalItem(newItem)}
        />
      )}

      {/* Admin Settings Modal */}
      {isSettingsOpen && (
        <AdminSettingsModal
          settings={settings}
          currentUser={currentUser}
          onSaveSettings={handleSaveSettings}
          onSyncNow={syncArchive}
          onLoadSamples={handleLoadSamples}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
