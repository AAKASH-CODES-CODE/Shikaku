import { RotateCcw, Undo2, Redo2, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

interface ToolbarProps {
  onRestart: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canRestart?: boolean;
  disabledAll?: boolean;
  reducedMotion?: boolean;
  inactivitySeconds?: number;
}

export default function Toolbar({
  onRestart,
  onUndo,
  onRedo,
  onHint,
  canUndo,
  canRedo,
  canRestart = true,
  disabledAll = false,
  reducedMotion = false,
  inactivitySeconds = 0,
}: ToolbarProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 140,
        damping: 18,
      },
    },
  };

  return (
    <motion.div
      variants={reducedMotion ? {} : containerVariants}
      initial="hidden"
      animate="show"
      className="w-full bento-card p-2 md:p-4 flex items-center justify-between gap-2 md:gap-4 select-none transition-all"
    >
      {/* Undo/Redo Action Cluster */}
      <div className="flex items-center gap-2">
        <motion.button
          id="btn-undo"
          onClick={onUndo}
          whileTap={(!canUndo || disabledAll || reducedMotion) ? {} : { scale: 0.92 }}
          disabled={!canUndo || disabledAll}
          title="Undo Move"
          aria-label="Undo Move"
          className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            canUndo && !disabledAll
              ? 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200'
              : 'border-neutral-100 dark:border-neutral-900 text-neutral-300 dark:text-neutral-800 cursor-not-allowed opacity-50'
          }`}
        >
          <Undo2 className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>

        <motion.button
          id="btn-redo"
          onClick={onRedo}
          whileTap={(!canRedo || disabledAll || reducedMotion) ? {} : { scale: 0.92 }}
          disabled={!canRedo || disabledAll}
          title="Redo Move"
          aria-label="Redo Move"
          className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            canRedo && !disabledAll
              ? 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200'
              : 'border-neutral-100 dark:border-neutral-900 text-neutral-300 dark:text-neutral-800 cursor-not-allowed opacity-50'
          }`}
        >
          <Redo2 className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Separator line */}
      <div className="h-8 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden lg:block" />

      {/* Right/Middle Action Cluster (Restart & Priority Hints) */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <motion.button
          id="btn-restart"
          onClick={onRestart}
          whileTap={disabledAll || reducedMotion || !canRestart ? {} : { scale: 0.92 }}
          disabled={disabledAll || !canRestart}
          title="Restart Puzzle"
          aria-label="Restart Puzzle"
          className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            canRestart && !disabledAll
              ? 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              : 'border-neutral-100 dark:border-neutral-900 text-neutral-300 dark:text-neutral-800 cursor-not-allowed opacity-50'
          }`}
        >
          <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>

        <motion.button
          id="btn-hint"
          onClick={onHint}
          whileHover={disabledAll || reducedMotion ? {} : { scale: 1.02 }}
          whileTap={disabledAll || reducedMotion ? {} : { scale: 0.95 }}
          disabled={disabledAll}
          title="Get Hint"
          aria-label="Get Hint"
          className={`h-12 px-3 md:px-6 rounded-xl font-semibold tracking-tight transition-all flex items-center justify-center gap-1.5 md:gap-2 shadow-sm ${
            !disabledAll
              ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-black hover:opacity-90 cursor-pointer'
              : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed'
          }`}
        >
          <Lightbulb className={`w-4 h-4 md:w-4.5 md:h-4.5 ${!disabledAll ? 'text-amber-400 fill-amber-400' : ''}`} />
          <div className="flex flex-col justify-center items-start leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">Use Hint</span>
              <span className="text-[9px] font-bold font-mono px-1 py-0.5 rounded bg-amber-500/[0.12] dark:bg-amber-500/[0.08] text-amber-600 dark:text-amber-400 border border-amber-500/20 leading-none">
                -20c
              </span>
            </div>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}
