import { ArrowLeft, Sun, Moon, Settings, Coins } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  levelNumber: number;
  difficulty: string;
  seconds: number;
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  isCampaignMode?: boolean;
  coins?: number;
}

export default function Header({
  levelNumber,
  difficulty,
  seconds,
  onBack,
  isDarkMode,
  onToggleDarkMode,
  onOpenSettings,
  isCampaignMode = false,
  coins = 100,
}: HeaderProps) {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <header className="w-full bento-card p-3 md:p-4 flex items-center justify-between gap-2 select-none z-40 transition-all">
      {/* Left Action: Back Arrow + Title */}
      <div className="flex items-center space-x-3 shrink-0">
        <button
          id="btn-back"
          onClick={onBack}
          title="Return to Menu/Generate New"
          aria-label="Back to level settings"
          className="p-2 md:p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
        </button>
        <div className="flex flex-col justify-center">
          <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase font-mono block leading-none mb-0.5">
            {capitalize(difficulty)} Mode
          </span>
          <h1 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white tracking-tight font-sans leading-none">
            {isCampaignMode ? `Level ${levelNumber}` : `Puzzle #${levelNumber}`}
          </h1>
        </div>
      </div>

      {/* Right Content: Timer / Controls mapped cleanly */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0 flex-nowrap">
        {/* Timer */}
        <div className="flex items-center gap-1.5 bg-neutral-100/60 dark:bg-neutral-900/60 px-2.5 py-1.5 rounded-xl border border-neutral-200/40 dark:border-neutral-800/60 h-9 shrink-0 select-none">
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 dark:text-neutral-500 mr-0.5 hidden xs:inline">Time</span>
          <span id="game-timer" className="text-sm font-bold tabular-nums text-neutral-900 dark:text-white font-mono leading-none">
            {formatTime(seconds)}
          </span>
        </div>

        {/* Coins indicator */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/[0.08] dark:bg-amber-500/[0.06] border border-amber-500/25 rounded-xl text-amber-600 dark:text-amber-400 font-mono text-sm font-bold leading-none select-none shadow-[0_1px_2px_rgba(245,158,11,0.03)] h-9 shrink-0">
          <Coins className="w-4 h-4 text-amber-500 fill-amber-500 animate-[pulse_2.5s_infinite]" />
          <span>{coins}</span>
        </div>

        {/* Action Toggles Cluster */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {/* Theme select */}
          <button
            id="btn-toggle-theme"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Enable Light Mode' : 'Enable Dark Mode'}
            aria-label={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-white bg-white dark:bg-[#1C1C1E] border border-neutral-200/60 dark:border-neutral-800 hover:shadow-sm active:scale-95 transition-all cursor-pointer h-9 w-9 flex items-center justify-center shrink-0"
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-neutral-600" />}
          </button>

          {/* Settings cog */}
          <button
            id="btn-toggle-settings"
            onClick={onOpenSettings}
            title="Open Game Settings"
            aria-label="Settings"
            className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-white bg-white dark:bg-[#1C1C1E] border border-neutral-200/60 dark:border-neutral-800 hover:shadow-sm active:scale-95 transition-all cursor-pointer h-9 w-9 flex items-center justify-center shrink-0"
          >
            <Settings className="w-4.5 h-4.5 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
