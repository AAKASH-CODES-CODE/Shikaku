import { Award, Timer, ArrowRight, Home, Trophy, Coins, Download, Sparkles } from 'lucide-react';
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
  earnedCoins?: number;
  isNewBestTime?: boolean;
  userProfile?: any;
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
  reducedMotion = false,
  earnedCoins = 0,
  isNewBestTime = false,
  userProfile = null,
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

  const handleDownloadCard = () => {
    // Create an offscreen canvas with high resolution for pristine crispness
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background gradient (Rich Indigo-Slate Midnight theme)
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 750);
    bgGrad.addColorStop(0, '#0F0C20');
    bgGrad.addColorStop(0.5, '#15102A');
    bgGrad.addColorStop(1, '#06040A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw aesthetic grid lines mimicking the Shikaku game matrix
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.12)';
    ctx.lineWidth = 1;
    const gridSize = 75;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Overlay some illuminated grid blocks reminiscent of solved blocks
    ctx.fillStyle = isNewBestTime ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(150, 150, 300, 225);
    ctx.strokeStyle = isNewBestTime ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(150, 150, 300, 225);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.06)';
    ctx.fillRect(750, 300, 300, 150);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.strokeRect(750, 300, 300, 150);

    // 3. Glowing orb in center
    const glowRad = ctx.createRadialGradient(600, 375, 50, 600, 375, 450);
    glowRad.addColorStop(0, isNewBestTime ? 'rgba(245, 158, 11, 0.15)' : 'rgba(124, 58, 237, 0.15)');
    glowRad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowRad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer border outlines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.strokeStyle = isNewBestTime ? '#F59E0B' : '#10B981';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // 4. Branding & Seal
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.fillText('SHIKAKU JAPANESE GRID PUZZLE', 80, 85);

    const accentColor = isNewBestTime ? '#F59E0B' : '#10B981';
    ctx.fillStyle = accentColor;
    ctx.fillRect(48, 68, 18, 18);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 72, 10, 10);

    // Badge Title
    const badgeText = isNewBestTime ? '🏆 SPEED CHAMPION' : '⭐ PUZZLE CONQUEROR';
    ctx.fillStyle = isNewBestTime ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = isNewBestTime ? '#F59E0B' : '#10B981';
    ctx.lineWidth = 1.5;
    
    const badgeWidth = 240;
    const badgeHeight = 36;
    const bx = 80;
    const by = 130;
    ctx.beginPath();
    // Using a simple polygon since roundRect is standard but safety first
    ctx.roundRect ? ctx.roundRect(bx, by, badgeWidth, badgeHeight, 18) : ctx.rect(bx, by, badgeWidth, badgeHeight);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, bx + badgeWidth/2, by + 22);
    ctx.textAlign = 'left';

    // 5. Header Title Achievement
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px "Inter", sans-serif';
    ctx.fillText(isNewBestTime ? 'NEW PERSONAL BEST!' : 'PUZZLE COMPLETED!', 80, 240);

    // Subheader labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('PLAYER SIGNATURE', 80, 310);

    const name = userProfile?.displayName || 'Elite Shikaku Solver';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px "Inter", sans-serif';
    ctx.fillText(name, 80, 355);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 410);
    ctx.lineTo(1120, 410);
    ctx.stroke();

    // Stats Grid Box Generator
    const drawBox = (x: number, y: number, titleStr: string, valStr: string, sideColor: string) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, 220, 130, 16) : ctx.rect(x, y, 220, 130);
      ctx.fill();
      ctx.stroke();

      // Side stripe decoration
      ctx.fillStyle = sideColor;
      ctx.fillRect(x + 12, y + 25, 4, 80);

      // Label text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText(titleStr, x + 30, y + 42);

      // Value text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Inter", sans-serif';
      ctx.fillText(valStr, x + 30, y + 96);
    };

    const sy = 460;
    drawBox(80, sy, 'DIFFICULTY', difficulty.toUpperCase(), '#A78BFA');
    drawBox(330, sy, 'SOLVED TIME', formatTime(seconds), '#34D399');
    drawBox(580, sy, 'ACTIVE STREAK', `${streak} \u200D🔥`, '#F87171');
    drawBox(830, sy, 'CHALLENGE TYPE', isDailyChallenge ? 'DAILY' : 'CLASSIC', '#60A5FA');

    // Circular Seal
    ctx.strokeStyle = isNewBestTime ? 'rgba(245, 158, 11, 0.45)' : 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(1020, 220, 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isNewBestTime ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)';
    ctx.fill();

    ctx.save();
    ctx.translate(1020, 220);
    ctx.rotate(-0.2);
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED SCORE', 0, -12);
    ctx.font = '900 13px "Inter", sans-serif';
    ctx.fillText('OFFICIAL SEAL', 0, 8);
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.fillText(new Date().toLocaleDateString(), 0, 28);
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '12px "Inter", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('DESIGNED BY AAKASH KUMAR \u2022 INSTAGRAM @_ITZ_AKASH_3', 1120, 705);

    // Trigger immediate browser download
    try {
      const imgData = canvas.toDataURL('image/png');
      const downloader = document.createElement('a');
      downloader.download = `shikaku_best_score_${difficulty}_${seconds}s.png`;
      downloader.href = imgData;
      downloader.click();
    } catch (e) {
      console.error('Failed to trigger card download:', e);
    }
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
            className="w-full max-w-lg rounded-3xl p-6 sm:p-8 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xl relative overflow-hidden z-10"
          >
            {/* Absolute visual patterns */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10" />

            <motion.div
              initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={reducedMotion ? {} : { type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
              className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 shadow-sm"
            >
              <Award className="w-8 h-8" />
            </motion.div>

            <h3 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-1.5 font-sans">
              {isDailyChallenge ? "Daily Solved!" : "Pristine Solved!"}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5 max-w-sm mx-auto leading-relaxed">
              {isDailyChallenge 
                ? "You have perfectly resolved today's global puzzle! See how you perform on the leaderboards."
                : `You have perfectly subdivided the ${capitalize(difficulty)} puzzle matching all logical constraints.`
              }
            </p>

            {earnedCoins > 0 && (
              <motion.div
                initial={reducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={reducedMotion ? { duration: 0.2 } : { delay: 0.15, type: 'spring', damping: 15, stiffness: 180 }}
                className="mb-6 p-2.5 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/[0.08] to-amber-600/[0.04] dark:from-amber-500/[0.05] dark:to-transparent border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 font-bold text-xs tracking-tight"
              >
                <div className="w-5.5 h-5.5 rounded-full bg-amber-500 flex items-center justify-center text-white select-none shadow-[0_2px_4px_rgba(245,158,11,0.25)] shrink-0">
                  <Coins className="w-3 h-3 fill-amber-200 text-amber-500" />
                </div>
                <span className="font-sans uppercase tracking-wider text-[10px] sm:text-[11px]">Reward: <span className="font-mono text-xs font-extrabold text-amber-700 dark:text-amber-350">+{earnedCoins}</span> COINs</span>
              </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <motion.div
                initial={reducedMotion ? {} : { x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={reducedMotion ? {} : { delay: 0.2 }}
                className="p-4.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/40 dark:border-neutral-800/60"
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
                className="p-4.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/40 dark:border-neutral-800/60"
              >
                <span className="block text-neutral-400 dark:text-neutral-500 text-xs mb-1 font-mono uppercase tracking-wider">
                  Streak Counter
                </span>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                  {streak} 🔥
                </span>
              </motion.div>
            </div>

            {/* DESIGN WORK OF THE CENTURY: Beautifully Responsive Shareable Achievement Card Preview */}
            <div className="mb-6 p-4.5 rounded-2xl text-left bg-gradient-to-br from-violet-600/[0.08] to-fuchsia-600/[0.04] dark:from-violet-950/20 dark:to-fuchsia-950/10 border border-violet-500/15 dark:border-violet-500/20 relative overflow-hidden group">
              <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-violet-500/10 dark:bg-violet-500/15 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
              
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold tracking-widest text-violet-600 dark:text-violet-400 font-mono uppercase">
                      {isNewBestTime ? <Sparkles className="w-3.5 h-3.5" /> : null}
                      {isNewBestTime ? "🏆 NEW BEST RECORD" : "⭐ SHIKAKU CERTIFIED"}
                    </span>
                    <h4 className="text-base sm:text-lg font-extrabold text-neutral-850 dark:text-neutral-100 flex items-center gap-1.5 mt-0.5 font-sans">
                      {isNewBestTime ? "Speed Champion Medal!" : "Solver Achievement Card"}
                    </h4>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 border border-violet-500/20 text-[10px] font-extrabold text-violet-600 dark:text-violet-400 font-mono">
                    {difficulty.toUpperCase()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  <div>
                    <span className="block text-[9px] text-neutral-400 dark:text-neutral-500">CLEAR TIME</span>
                    <span className="font-bold text-neutral-850 dark:text-neutral-200">{formatTime(seconds)}</span>
                  </div>
                  <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800" />
                  <div>
                    <span className="block text-[9px] text-neutral-400 dark:text-neutral-500">PLAYER</span>
                    <span className="font-bold text-neutral-850 dark:text-neutral-200 truncate max-w-[130px] inline-block">
                      {userProfile?.displayName || 'Anonymous Solver'}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800" />
                  <div>
                    <span className="block text-[9px] text-neutral-400 dark:text-neutral-500">STREAK</span>
                    <span className="font-bold text-neutral-850 dark:text-neutral-200">{streak} 🔥</span>
                  </div>
                </div>

                <button
                  onClick={handleDownloadCard}
                  className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-extrabold text-xs select-none shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-violet-200" />
                  <span>Download Share Card</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {isDailyChallenge ? (
                <motion.button
                  whileHover={reducedMotion ? {} : { scale: 1.02 }}
                  whileTap={reducedMotion ? {} : { scale: 0.98 }}
                  id="modal-view-leaderboard"
                  onClick={onViewLeaderboard}
                  className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-semibold tracking-tight transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
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
                  className="w-full py-4 px-6 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 font-semibold tracking-tight transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
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

