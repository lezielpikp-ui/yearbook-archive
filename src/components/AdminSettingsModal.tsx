import React, { useState } from 'react';
import {
  X,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  HelpCircle,
  ExternalLink,
  LogOut,
  Sparkles,
  School,
  Lock,
  Globe,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { ArchiveSettings, DriveFolderInfo } from '../types/yearbook';
import { extractFolderId, verifyDriveFolder } from '../services/driveApi';
import { googleSignIn, logout } from '../services/firebaseAuth';

interface AdminSettingsModalProps {
  settings: ArchiveSettings;
  currentUser: User | null;
  onSaveSettings: (settings: ArchiveSettings) => void;
  onSyncNow: () => Promise<void>;
  onLoadSamples: () => void;
  onClose: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  settings,
  currentUser,
  onSaveSettings,
  onSyncNow,
  onLoadSamples,
  onClose,
}) => {
  const [folderInput, setFolderInput] = useState(settings.folderId);
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey || '');
  const [schoolNameInput, setSchoolNameInput] = useState(settings.schoolName);
  const [archiveTitleInput, setArchiveTitleInput] = useState(settings.archiveTitle);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<DriveFolderInfo | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const cleanId = extractFolderId(folderInput);

  const handleTestConnection = async () => {
    if (!folderInput.trim()) {
      setTestError('Please provide a Google Drive Folder ID or URL.');
      setTestResult(null);
      return;
    }

    setTesting(true);
    setTestError(null);
    setTestResult(null);

    try {
      const result = await verifyDriveFolder(folderInput, null, apiKeyInput);
      setTestResult(result);
    } catch (err: any) {
      setTestError(err.message || 'Failed to verify folder. Please check sharing settings.');
    } finally {
      setTesting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        // Automatically test folder if folderId is present
        if (folderInput) {
          try {
            const folderInfo = await verifyDriveFolder(
              folderInput,
              result.accessToken,
              apiKeyInput
            );
            setTestResult(folderInfo);
          } catch {
            // Non-blocking
          }
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in with Google');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      folderId: cleanId,
      apiKey: apiKeyInput.trim(),
      schoolName: schoolNameInput.trim() || 'BINA BANGSA SCHOOL',
      archiveTitle: archiveTitleInput.trim() || 'Yearbook Archive',
    });
    onClose();
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      await onSyncNow();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-lg font-bold text-white">
                Archive Admin Settings
              </h2>
              <p className="text-xs text-slate-400">
                Connect your Google Drive folder and configure the public yearbook repository
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 divide-y divide-slate-800/80">
          {/* Section 1: Google Drive Folder Source */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>Google Drive Folder ID or URL</span>
              </label>
              {cleanId && (
                <span className="text-[11px] font-mono text-amber-400/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                  ID: {cleanId}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={folderInput}
                onChange={(e) => {
                  setFolderInput(e.target.value);
                  setTestResult(null);
                  setTestError(null);
                }}
                placeholder="Paste Folder ID or full URL (e.g., 1A2b3c4D... or drive.google.com/drive/folders/...)"
                className="flex-grow px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !folderInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold shrink-0 transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Verify Folder</span>
                  </>
                )}
              </button>
            </div>

            {/* Test result status badge */}
            {testResult && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-emerald-200">
                    Connected to &ldquo;{testResult.name}&rdquo;
                  </div>
                  <div className="text-emerald-400/80">
                    Folder verified! Found {testResult.fileCount} file(s) available for the archive.
                  </div>
                </div>
              </div>
            )}

            {testError && (
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-rose-200">Connection Note</div>
                  <div className="text-rose-300/90 leading-relaxed">{testError}</div>
                </div>
              </div>
            )}

            {/* Public folder instructions card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>How to link your Google Drive folder:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed text-[11px]">
                <li>
                  In your Google Drive, create or open your <strong className="text-slate-200">Yearbooks</strong> folder.
                </li>
                <li>
                  Right-click the folder &gt; <strong className="text-slate-200">Share</strong> &gt; General access: change to <strong className="text-emerald-400">&ldquo;Anyone with the link&rdquo;</strong> (Viewer).
                </li>
                <li>
                  Click <strong className="text-slate-200">Copy link</strong> and paste it directly into the input above.
                </li>
                <li>
                  Upload your PDF yearbooks directly in Google Drive — the app will auto-detect and sort them by year!
                </li>
              </ol>
            </div>
          </div>

          {/* Section 2: Admin Google Sign-In & Authentication */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Google Workspace Administrator Sign-In</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign in with your Google account to grant live Google Drive access
                </p>
              </div>
              {currentUser && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  Signed In
                </span>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Admin'}
                      className="w-10 h-10 rounded-full border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-500/30">
                      {(currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm text-slate-200">
                      {currentUser.displayName || 'Admin User'}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Official Material Design Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-60 border border-slate-300"
                >
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-5 h-5 shrink-0"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{authLoading ? 'Signing in with Google...' : 'Sign in with Google'}</span>
                </button>

                {authError && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
                    {authError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Section 3: School Branding & Titles */}
          <div className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <School className="w-4 h-4 text-amber-400" />
              <span>School & Archive Branding</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  School / Institution Name
                </label>
                <input
                  type="text"
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  placeholder="e.g. Bina Bangsa School"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Archive Banner Title
                </label>
                <input
                  type="text"
                  value={archiveTitleInput}
                  onChange={(e) => setArchiveTitleInput(e.target.value)}
                  placeholder="e.g. Annual Yearbook Archive"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Auto-refresh & Sample Data */}
          <div className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-refreshes every 5 minutes automatically</span>
              </span>
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={syncing}
                className="text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1 cursor-pointer"
              >
                {syncing ? 'Syncing now...' : 'Sync Now'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  onLoadSamples();
                  onClose();
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Sample Yearbooks (Demo Mode)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-950 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};
