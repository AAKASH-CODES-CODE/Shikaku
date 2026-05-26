import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Timer, Calendar, CheckCircle, ChevronRight, RefreshCw, AlertCircle, Signal, SignalZero } from 'lucide-react';
import { getDailyLeaderboard, submitDailyScore, isFirebaseAvailable, auth, LeaderboardEntry } from '../utils/leaderboardService';
import { Difficulty } from '../types';
import { sfx } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayDateStr: string;
  difficulty: Difficulty;
  justCompletedTime?: number | null; // Passed if just finished playing the Daily Challenge
  onScoreSubmitted?: () => void;
  isMuted: boolean;
  reducedMotion?: boolean;
}

export default function LeaderboardModal({
  isOpen,
  onClose,
  todayDateStr,
  difficulty,
  justCompletedTime = null,
  onScoreSubmitted,
  isMuted,
  reducedMotion = false
}: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Submit score form state
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('shikaku_player_name') || '';
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  // Load standings
  const fetchStandings = async () => {
    setLoading(true);
    setError(null);
    try {
      const scores = await getDailyLeaderboard(todayDateStr, difficulty);
      setEntries(scores);
    } catch (err) {
      console.error(err);
      setError("Unable to sync leaderboard. Loading local records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStandings();
      setHasSubmitted(false);
    }
  }, [isOpen, todayDateStr, difficulty]);

  const handleNameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !justCompletedTime) return;

    setSubmitting(true);
    try {
      sfx.playLockClick(isMuted);
      // Save name choice locally
      localStorage.setItem('shikaku_player_name', username.trim());
      
      // Submit score to database service
      await submitDailyScore(todayDateStr, username.trim(), justCompletedTime, difficulty);
      
      setHasSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
      // Refresh list to show user's newly submitted time
      await fetchStandings();
    } catch (err) {
      console.error("Submission error:", err);
      // Even if cloud write fails, fallback was executed and we can refresh
      setHasSubmitted(true);
      await fetchStandings();
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (sec: number | null | undefined) => {
    if (sec === null || sec === undefined || isNaN(sec)) return '--:--';
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseDifficulty = (diff: Difficulty) => {
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };

  const formatHumanDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (e) {}
    return dateStr;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/40 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 15 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            transition={reducedMotion ? { duration: 0.2 } : { type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 select-none z-10"
          >
            {/* Connection status pills */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-850 rounded-full text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-500 dark:text-neutral-400">
                {isFirebaseAvailable ? (
                  <>
                    <Signal className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Cloud Live Standings</span>
                  </>
                ) : (
                  <>
                    <SignalZero className="w-3.5 h-3.5 text-orange-400" />
                    <span>Local Offline Standings</span>
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white" />
              </button>
            </div>

            {/* Header Title Section */}
            <div className="flex items-start space-x-3.5 mb-5 text-left">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight">Daily Leaderboard</h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-sans flex items-center mt-0.5 gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatHumanDate(todayDateStr)}</span>
                  <span className="mx-1">•</span>
                  <span className="font-semibold text-neutral-500 dark:text-neutral-300">
                    {parseDifficulty(difficulty)} Mode
                  </span>
                </p>
              </div>
            </div>

            {/* 1. Score submission form (If completed right now) */}
            {justCompletedTime !== null && !hasSubmitted && (
              <motion.div
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                className="p-5 bg-emerald-500/5 dark:bg-emerald-500/[0.03] border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl mb-5 text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-sm font-bold text-neutral-850 dark:text-white">New Personal Finish logged!</h4>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed mb-4">
                  You completed today's challenge in <strong className="text-neutral-800 dark:text-white font-semibold">{formatTime(justCompletedTime)}</strong>. Enter your signature display name to list your score! {(!auth || !auth.currentUser) && "💡 Link Google in Settings to post your scores to the global cloud leaderboard."}
                </p>
                <form onSubmit={handleNameSubmit} className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Name (e.g. Atsushi)"
                    value={username}
                    maxLength={20}
                    required
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] dark:focus:ring-[#0A84FF] shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !username.trim()}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs rounded-xl tracking-tight transition-all active:scale-95 flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Submit'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* 2. Standings List Box */}
            <div className="min-h-[220px] max-h-[300px] overflow-y-auto pr-1.5 space-y-2 relative border border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/20 dark:bg-neutral-950/10 rounded-2xl p-3">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-neutral-300 dark:text-neutral-700 animate-spin" />
                  <span className="text-xs text-neutral-400 font-medium">Checking standings...</span>
                </div>
              ) : error && entries.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="w-7 h-7 text-neutral-300 dark:text-neutral-700 mb-1.5" />
                  <span className="text-xs text-neutral-400 max-w-xs">{error}</span>
                </div>
              ) : entries.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <Trophy className="w-8 h-8 text-neutral-300 dark:text-neutral-700 opacity-50 mb-1.5" />
                  <span className="text-xs text-neutral-400 font-medium font-sans">Be the first to finish today's board!</span>
                </div>
              ) : (
                entries.map((entry, index) => {
                  const isTop3 = index < 3;
                  const isCurrentUser = entry.userId && localStorage.getItem('shikaku_player_uid') === entry.userId;
                  
                  return (
                    <motion.div
                      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -5 }}
                      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                      transition={reducedMotion ? { duration: 0.1 } : { delay: index * 0.04 }}
                      key={entry.userId + '_' + index}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors border select-none ${
                        isCurrentUser 
                        ? 'bg-[#007AFF]/5 dark:bg-[#0A84FF]/[0.03] border-[#007AFF]/20 dark:border-[#0A84FF]/20 shadow-sm'
                        : 'bg-white dark:bg-neutral-900 border-neutral-150 dark:border-neutral-850'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        {/* Position indicator */}
                        <div className="flex items-center justify-center w-6 h-6">
                          {index === 0 ? (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-white font-mono text-[10px] font-black shadow-sm ring-2 ring-amber-300">1</div>
                          ) : index === 1 ? (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 text-neutral-800 font-mono text-[10px] font-black shadow-sm ring-2 ring-slate-205">2</div>
                          ) : index === 2 ? (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white font-mono text-[10px] font-black shadow-sm ring-2 ring-amber-500/70">3</div>
                          ) : (
                            <span className="text-xs text-neutral-400 font-mono font-medium">{index + 1}</span>
                          )}
                        </div>

                        <div>
                          <span className={`text-sm tracking-tight font-sans ${isCurrentUser ? 'font-bold text-[#007AFF] dark:text-[#0A84FF]' : 'font-medium'}`}>
                            {entry.playerName}
                          </span>
                          {isCurrentUser && (
                            <span className="ml-1.5 text-[9px] uppercase tracking-wider font-mono bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 text-[#007AFF] dark:text-[#0A84FF] px-1 rounded font-bold">You</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Timer className={`w-3.5 h-3.5 ${isTop3 ? 'text-neutral-400' : 'text-neutral-300 dark:text-neutral-700'}`} />
                        <span className="text-xs font-mono font-bold text-neutral-850 dark:text-neutral-100">
                          {formatTime(entry.completionTime)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Sync refresh button */}
            <div className="mt-5 flex justify-between items-center text-[10px] text-neutral-400 font-mono">
              <span>Times sorted from fastest to slowest.</span>
              <button
                onClick={fetchStandings}
                disabled={loading}
                className="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-white transition-all cursor-pointer bg-neutral-50 dark:bg-neutral-850 px-2 py-1 rounded border border-neutral-100 dark:border-neutral-800 active:scale-95"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
