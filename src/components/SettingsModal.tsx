import { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Sun, Moon, Activity, Zap, User, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GOOGLE_CLIENT_ID, GoogleUserProfile, getGoogleProfile, decodeJwt, saveGoogleProfile, logoutGoogleProfile } from '../utils/leaderboardService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  isDarkMode,
  onToggleDarkMode,
  reducedMotion,
  onToggleReducedMotion,
}: SettingsModalProps) {
  const [profile, setProfile] = useState<GoogleUserProfile | null>(getGoogleProfile());
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen for login/logout profile changes dynamically
  useEffect(() => {
    const handler = () => {
      setProfile(getGoogleProfile());
      setAuthError(null);
    };
    const errorHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.error) {
        setAuthError(customEvent.detail.error);
      }
    };
    window.addEventListener('shikaku_auth_changed', handler);
    window.addEventListener('shikaku_auth_error', errorHandler as any);
    return () => {
      window.removeEventListener('shikaku_auth_changed', handler);
      window.removeEventListener('shikaku_auth_error', errorHandler as any);
    };
  }, []);

  // Set up and render Google sign-in button dynamically
  useEffect(() => {
    if (isOpen && GOOGLE_CLIENT_ID && !profile) {
      const initGoogle = () => {
        const anyWindow = window as any;
        if (anyWindow.google && anyWindow.google.accounts && anyWindow.google.accounts.id) {
          anyWindow.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              const decoded = decodeJwt(response.credential);
              if (decoded) {
                decoded.idToken = response.credential;
                saveGoogleProfile(decoded);
              }
            },
          });
          
          const btnElem = document.getElementById("google-signin-btn");
          if (btnElem) {
            anyWindow.google.accounts.id.renderButton(btnElem, {
              theme: isDarkMode ? "dark" : "outline",
              size: "medium",
              text: "signin_with",
              shape: "rectangular",
            });
          }
        }
      };

      // Poll/Check if Google library has finished mounting
      const anyWindow = window as any;
      if (anyWindow.google) {
        initGoogle();
      } else {
        const interval = setInterval(() => {
          if (anyWindow.google) {
            initGoogle();
            clearInterval(interval);
          }
        }, 150);
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, profile, isDarkMode]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/40 dark:bg-neutral-950/70 backdrop-blur-xs"
          />

          {/* Modal content */}
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 15 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 15 }}
            transition={reducedMotion ? { duration: 0.2 } : { type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-xl relative z-60 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
                <span>Control Panel</span>
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options List */}
            <div className="py-4 space-y-5">
              {/* Google Sign-In Card / Container */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-950/45 border border-neutral-150 dark:border-neutral-850 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 text-[11px] flex items-center gap-1.5 uppercase tracking-wider font-mono">
                    <User className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#0A84FF]" />
                    <span>Google Solver Account</span>
                  </div>
                  {profile && (
                    <button
                      onClick={() => logoutGoogleProfile()}
                      className="text-[10px] text-red-500 hover:text-red-650 flex items-center gap-1 font-bold uppercase tracking-wider cursor-pointer font-mono"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  )}
                </div>

                {profile ? (
                  <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800/80 p-2.5 rounded-xl">
                    {profile.picture ? (
                      <img
                        src={profile.picture}
                        alt={profile.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#007AFF]/10 flex items-center justify-center font-bold text-[#007AFF] text-xs">
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{profile.name}</h4>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{profile.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-normal">
                      Link your Google account to automatically record your personal times on the Daily Leaderboard!
                    </p>
                    
                    {GOOGLE_CLIENT_ID ? (
                      <div className="flex flex-col gap-2">
                        <div className="mt-1 flex justify-center py-1.5 bg-white dark:bg-neutral-950/60 rounded-xl border border-neutral-150 dark:border-neutral-800">
                          <div id="google-signin-btn" className="scale-95 origin-center"></div>
                        </div>
                        {authError && (
                          <div className="bg-red-500/[0.06] dark:bg-red-500/[0.03] p-3 rounded-xl border border-red-500/20 text-left">
                            <p className="text-[10px] text-red-600 dark:text-red-450 leading-relaxed">
                              Sign-in error: {authError}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-550/[0.06] dark:bg-amber-500/[0.03] p-3 rounded-xl border border-amber-500/20 text-left">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-500">Google Credentials Needed</h4>
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-450 leading-relaxed">
                          Once your build starts, add your generated Google Client ID to <code>VITE_GOOGLE_CLIENT_ID</code> in env settings.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reduced Motion Switch */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-grow">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
                    <span>Reduced Motion</span>
                  </div>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    Disables screen shake, grid pop-ups, and particle explosion animations.
                  </p>
                </div>
                <button
                  onClick={onToggleReducedMotion}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                    reducedMotion ? 'bg-[#007AFF] dark:bg-[#0A84FF]' : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-grow">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm flex items-center gap-2">
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
                    )}
                    <span>Sound Effects</span>
                  </div>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    Toggle audio playbacks, hint pings, and cascading victory waves.
                  </p>
                </div>
                <button
                  onClick={onToggleMute}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                    !isMuted ? 'bg-[#007AFF] dark:bg-[#0A84FF]' : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      !isMuted ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-grow">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm flex items-center gap-2">
                    {isDarkMode ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-500" />
                    )}
                    <span>Dark Mode Theme</span>
                  </div>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    Switches the board aesthetics between light and dark modes.
                  </p>
                </div>
                <button
                  onClick={onToggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                    isDarkMode ? 'bg-[#007AFF] dark:bg-[#0A84FF]' : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-neutral-105 dark:border-neutral-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs rounded-xl shadow-sm tracking-tight transition-all active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
