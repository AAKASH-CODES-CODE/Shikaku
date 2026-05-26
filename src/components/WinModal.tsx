import { Award, Timer, ArrowRight, Home, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WinModalProps {
  isOpen: boolean;
  seconds: number;
  streak: number;
  difficulty: string;
  onNext: () => void;
  onHome: () => void;
  isDailyChallenge?: boolean;
  onViewLeaderboard?: () => void;
  reducedMotion?: boolean;
}

export default function WinModal({
  isOpen,
  seconds,
  streak,
  difficulty,
  onNext,
  onHome,
  isDailyChallenge = false,
  onViewLeaderboard,
  reducedMotion = false
}: WinModalProps) {
  const formatTime = (sec: number) => {
    if (sec === null || sec === undefined || isNaN(sec)) return '--:--';
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm"
          />
          <motion.div
            initial={reducedMotion ? { scale: 1, opacity: 0 } : { scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={reducedMotion ? { scale: 1, opacity: 0 } : { scale: 0.9, opacity: 0, y: 20 }}
            transition={reducedMotion ? { duration: 0.2 } : { type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md rounded-3xl p-8 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xl relative overflow-hidden z-10"
          >
            {/* Absolute visual patterns */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10" />

            <motion.div
              initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={reducedMotion ? {} : { type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
              className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm"
            >
              <Award className="w-8 h-8" />
            </motion.div>

            <h3 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2 font-sans">
              {isDailyChallenge ? "Daily Solved!" : "Pristine Solved!"}
            </h3>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-8 max-w-sm mx-auto">
              {isDailyChallenge 
                ? "You have perfectly resolved today's global puzzle! See how you perform on the leaderboards."
                : `You have perfectly subdivided the ${capitalize(difficulty)} puzzle matching all logical constraints.`
              }
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <motion.div
                initial={reducedMotion ? {} : { x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={reducedMotion ? {} : { delay: 0.2 }}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/40 dark:border-neutral-800/60"
              >
                <div className="flex items-center justify-center text-neutral-400 dark:text-neutral-500 space-x-1 text-xs mb-1 font-mono uppercase tracking-wider">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Duration</span>
                </div>
                <span className="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                  {formatTime(seconds)}
                </span>
              </motion.div>

              <motion.div
                initial={reducedMotion ? {} : { x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={reducedMotion ? {} : { delay: 0.3 }}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/40 dark:border-neutral-800/60"
              >
                <span className="block text-neutral-400 dark:text-neutral-500 text-xs mb-1 font-mono uppercase tracking-wider">
                  Streak Counter
                </span>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                  {streak} 🔥
                </span>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {isDailyChallenge ? (
                <motion.button
                  whileHover={reducedMotion ? {} : { scale: 1.02 }}
                  whileTap={reducedMotion ? {} : { scale: 0.98 }}
                  id="modal-view-leaderboard"
                  onClick={onViewLeaderboard}
                  className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-semibold tracking-tight transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                >
                  <span>View Leaderboard</span>
                  <Trophy className="w-5 h-5 text-white" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={reducedMotion ? {} : { scale: 1.02 }}
                  whileTap={reducedMotion ? {} : { scale: 0.98 }}
                  id="modal-next-puzzle"
                  onClick={onNext}
                  className="w-full py-4 px-6 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 font-semibold tracking-tight transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                >
                  <span>Next Puzzle</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}

              <motion.button
                whileHover={reducedMotion ? {} : { scale: 1.02 }}
                whileTap={reducedMotion ? {} : { scale: 0.98 }}
                id="modal-home-menu"
                onClick={onHome}
                className="w-full py-3.5 px-6 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Home className="w-4.5 h-4.5" />
                <span>Main Menu</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
