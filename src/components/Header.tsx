import { ArrowLeft, Sun, Moon, Settings } from 'lucide-react';
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
            {isCampaignMode ? `Campaign Level ${levelNumber}` : `Puzzle #${levelNumber}`}
          </h1>
        </div>
      </div>

      {/* Right Content: Timer / Controls mapped cleanly */}
      <div className="flex items-center justify-end gap-3 md:gap-5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[9px] md:text-[10px] font-bold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase font-mono leading-none mb-0.5">Time Elapsed</div>
            <div id="game-timer" className="text-lg md:text-xl font-bold tabular-nums text-neutral-900 dark:text-white font-mono leading-none">
              {formatTime(seconds)}
            </div>
          </div>
        </div>

        <div className="h-6 md:h-8 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

        {/* Action Toggles Cluster */}
        <div className="flex items-center space-x-0.5 md:space-x-1">
          {/* Theme select */}
          <button
            id="btn-toggle-theme"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Enable Light Mode' : 'Enable Dark Mode'}
            aria-label={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            className="p-2.5 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-neutral-700" />}
          </button>

          {/* Settings cog */}
          <button
            id="btn-toggle-settings"
            onClick={onOpenSettings}
            title="Open Game Settings"
            aria-label="Settings"
            className="p-2.5 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer"
          >
            <Settings className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
