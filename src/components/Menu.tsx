import { useState } from 'react';
import { Award, Zap, Timer, Check, Play, Calendar, Trophy, ChevronRight, TrendingUp, BarChart2, Power, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { Difficulty } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface MenuProps {
  onStartGame: (diff: Difficulty) => void;
  onStartTutorial: () => void;
  onStartDailyChallenge: () => void;
  onViewLeaderboard: () => void;
  stats: {
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    bestEasyTime: number | null;
    bestMediumTime: number | null;
    bestHardTime: number | null;
    currentStreak: number;
    bestStreak: number;
    history?: Array<{ id: string; timestamp: number; dateStr: string; difficulty: string; time: number }>;
  };
  todayDateStr: string;
  dailyDifficulty: Difficulty;
  dailyCompleted: boolean;
  reducedMotion?: boolean;
  campaignLevel: number;
  onStartCampaignLevel: (levelNum: number) => void;
  onExitGame?: () => void;
  hasCompletedTutorial?: boolean;
  onPlayTeaser: () => void;
}

export default function Menu({
  onStartGame,
  onStartTutorial,
  onStartDailyChallenge,
  onViewLeaderboard,
  stats,
  todayDateStr,
  dailyDifficulty,
  dailyCompleted,
  reducedMotion = false,
  campaignLevel,
  onStartCampaignLevel,
  onExitGame,
  hasCompletedTutorial = false,
  onPlayTeaser,
}: MenuProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const isLocked = campaignLevel === 1 && !hasCompletedTutorial;

  const historyList = stats.history || [];
  
  // Arrange historical data in ascending order of time for trend plotting
  const chartData = [...historyList]
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter(item => activeFilter === 'all' || item.difficulty === activeFilter);

  const activeColor = 
    activeFilter === 'easy' ? '#10B981' : 
    activeFilter === 'medium' ? '#3B82F6' : 
    activeFilter === 'hard' ? '#F59E0B' : 
    '#3B82F6';

  const formatYAxisTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl shadow-xl flex flex-col gap-1 select-none text-left">
          <p className="text-[9px] font-bold font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{data.dateStr}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ 
                backgroundColor: 
                  data.difficulty === 'easy' ? '#10B981' : 
                  data.difficulty === 'medium' ? '#3B82F6' : '#F59E0B'
              }} 
            />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 capitalize">
              {data.difficulty} Game
            </span>
          </div>
          <p className="text-xs font-extrabold text-[#007AFF] dark:text-[#0A84FF] font-mono mt-0.5">
            Solve Time: {formatYAxisTime(data.time)}
          </p>
        </div>
      );
    }
    return null;
  };

  const formatTime = (sec: number | null) => {
    if (sec === null) return '—';
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const difficultyCards: {
    id: Difficulty;
    title: string;
    gridSize: string;
    description: string;
    borderColor: string;
    bgHover: string;
    clueColor: string;
  }[] = [
    {
      id: 'easy',
      title: 'Easy Sandbox',
      gridSize: '5x5 Grid',
      description: 'Ideal for practicing logical flow. Smaller rectangles, straightforward placements.',
      borderColor: 'hover:border-emerald-500/50',
      bgHover: 'hover:bg-emerald-500/[0.02]',
      clueColor: 'text-emerald-500',
    },
    {
      id: 'medium',
      title: 'Medium Sandbox',
      gridSize: '10x10 Grid',
      description: 'Balanced brain engagement. Moderate areas, moderately complex partitions.',
      borderColor: 'hover:border-blue-500/50',
      bgHover: 'hover:bg-blue-500/[0.02]',
      clueColor: 'text-blue-500',
    },
    {
      id: 'hard',
      title: 'Hard Sandbox',
      gridSize: '15x15 Grid',
      description: 'Serious brain puzzles. Supports narrow and elongated rectangles like 1x8 or 1x15.',
      borderColor: 'hover:border-amber-500/50',
      bgHover: 'hover:bg-amber-500/[0.02]',
      clueColor: 'text-amber-500',
    },
  ];

  // Framer Motion staggered grid variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
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

  const tutorialCard = (
    <div
      id="tutorial-banner-card"
      onClick={onStartTutorial}
      className={`w-full bento-card p-5 md:p-6 flex flex-col justify-between gap-5 cursor-pointer transition-all duration-300 hover:scale-[1.01] shadow-sm text-left ${
        !hasCompletedTutorial 
          ? 'border-blue-500/80 bg-blue-500/[0.02] dark:border-blue-500/50 dark:bg-blue-500/[0.01] ring-2 ring-blue-500/30' 
          : 'hover:border-[#007AFF] hover:bg-[#007AFF]/[0.02] dark:hover:border-[#0A84FF] dark:hover:bg-[#0A84FF]/[0.01]'
      }`}
    >
      {!hasCompletedTutorial && (
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-500/10 dark:text-blue-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
          <span>🎯 Required</span>
        </div>
      )}

      <div className="flex items-start space-x-4 animate-fade-in">
        <div className={`p-3 rounded-xl ${!hasCompletedTutorial ? 'bg-blue-200 dark:bg-blue-900/60 text-[#007AFF] dark:text-[#0A84FF]' : 'bg-blue-100 dark:bg-blue-900/40 text-[#007AFF] dark:text-[#0A84FF]'}`}>
          <Play className="w-6 h-6 fill-current" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#007AFF] dark:text-[#0A84FF] bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 px-2 py-0.5 rounded">
            Tutorial
          </span>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-1.5">
            Interactive Tutorial Mode
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-1.5 leading-relaxed">
            New to Shikaku? Learn the rules step-by-step, draw your first rectangle, and master clearing invalid cells.
          </p>
        </div>
      </div>
      <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-900/40">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartTutorial();
          }}
          className={`px-5 py-2.5 text-white font-semibold text-xs rounded-xl shadow-sm tracking-tight transition-all active:scale-95 cursor-pointer ${
            !hasCompletedTutorial 
              ? 'bg-blue-600 hover:bg-blue-700 dark:bg-[#007AFF] dark:hover:bg-[#0A84FF] animate-bounce' 
              : 'bg-[#007AFF] hover:bg-[#0A84FF]'
          }`}
        >
          {hasCompletedTutorial ? 'Replay Tutorial' : 'Start Practice'}
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      id="game-menu-view"
      variants={reducedMotion ? {} : containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-4xl mx-auto px-6 py-6 flex flex-col items-center justify-center space-y-8 select-none"
    >
      
      {/* Intro Header Section */}
      <motion.div
        variants={reducedMotion ? {} : itemVariants}
        className="text-center max-w-xl space-y-3 flex flex-col items-center"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-sans">
          Shikaku
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-mono tracking-widest uppercase">
          Divide into Rectangles
        </p>

        {/* Cinematic Launch Teaser Trigger Banner */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPlayTeaser}
          className="mt-1 text-xs font-semibold px-4 py-1.5 bg-neutral-900 dark:bg-neutral-850 text-white rounded-full flex items-center gap-2 border border-neutral-800/80 shadow-sm active:scale-95 transition-all cursor-pointer group hover:border-blue-500 hover:shadow-[0_0_12px_rgba(0,122,255,0.15)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <Video className="w-3.5 h-3.5 text-neutral-400 group-hover:text-blue-400 transition-colors" />
          <span>Play Cinematic Launch Teaser</span>
        </motion.button>
      </motion.div>      {/* Campaign Central Terminal */}
      <motion.div
        id="campaign-mode-box"
        variants={reducedMotion ? {} : itemVariants}
        className={`w-full bg-gradient-to-br from-[#007AFF]/5 to-[#34C759]/[0.02] dark:from-[#0A84FF]/[0.03] dark:to-[#34C759]/[0.01] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm text-left transition-all relative ${
          isLocked ? 'opacity-40 filter grayscale select-none pointer-events-none' : 'hover:shadow-md'
        }`}
      >
        <div className="space-y-3 max-w-xl font-sans">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              Campaign Mode
            </span>
            <span className="text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500">
              Grid: {campaignLevel <= 4 ? '5x5 (Easy)' : campaignLevel <= 10 ? '10x10 (Medium)' : '15x15 (Expert)'}
            </span>
          </div>
          <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Campaign Level {campaignLevel}
          </h3>
          <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            {campaignLevel <= 4 
              ? "Start with basic spatial partitions. Learn to build smaller rectangles and discover clue exclusions."
              : campaignLevel <= 10
              ? "Stepping up to balanced 10x10 grids. Requires thoughtful planning and identifying isolated regions."
              : "Welcome to expert 15x15 grids. Formulate elongated 1-cell wide segments and solve high-complexity layouts!"
            }
          </p>
        </div>
        <div className="flex flex-col items-center md:items-end gap-2 shrink-0 w-full md:w-auto">
          {isLocked ? (
            <button
              disabled
              className="w-full md:w-auto px-6 py-4 bg-neutral-200 dark:bg-neutral-800 text-neutral-450 dark:text-neutral-500 font-bold text-sm rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>🔒 Locked (Complete Tutorial)</span>
            </button>
          ) : (
            <button
              onClick={() => onStartCampaignLevel(campaignLevel)}
              className="w-full md:w-auto px-8 py-4 bg-[#007AFF] hover:bg-[#0A84FF] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#007AFF]/10 tracking-tight transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Play Level {campaignLevel}</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          )}
          <span className="text-[10px] font-mono text-neutral-450 dark:text-neutral-500">
            Progress autosaves as you complete levels
          </span>
        </div>
      </motion.div>

      {/* Side-by-Side Launcher Banners */}
      <motion.div
        variants={reducedMotion ? {} : itemVariants}
        className={`grid grid-cols-1 ${!hasCompletedTutorial ? 'md:grid-cols-2' : ''} gap-6 w-full pt-1`}
      >
        
        {/* Interactive Tutorial Banner */}
        {!hasCompletedTutorial && tutorialCard}

        {/* Daily Challenge Banner */}
        <div
          id="daily-challenge-card"
          onClick={isLocked ? undefined : onStartDailyChallenge}
          className={`w-full bento-card p-5 md:p-6 flex flex-col justify-between gap-5 shadow-sm text-left relative overflow-hidden transition-all duration-300 ${isLocked ? 'opacity-40 filter grayscale pointer-events-none select-none' : 'cursor-pointer hover:border-amber-500 hover:bg-amber-500/[0.015] hover:scale-[1.01]'} ${
            dailyCompleted ? 'border-emerald-500/30 dark:border-emerald-500/10' : ''
          }`}
        >


          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl ${dailyCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-500'}`}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                Global Challenge
              </span>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-1.5">
                Daily Board Leaderboard
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-1.5 leading-relaxed">
                Solve today's unified master seed. Rank stats with other puzzle fans! Difficulty: <strong className="font-semibold text-neutral-850 dark:text-neutral-300 capitalize">{dailyDifficulty}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-900/40">
            <button
              id="btn-view-leaderboard"
              onClick={(e) => {
                e.stopPropagation();
                if (isLocked) return;
                onViewLeaderboard();
              }}
              disabled={isLocked}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                isLocked ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Standings</span>
            </button>
            {isLocked ? (
              <span className="text-xs font-bold text-neutral-450 dark:text-neutral-500 py-2.5">
                🔒 Complete Tutorial
              </span>
            ) : (
              <button
                onClick={onStartDailyChallenge}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-sm tracking-tight transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>{dailyCompleted ? 'Replay Board' : 'Play Arena'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        </div>

      </motion.div>

      {/* Sandbox Selections Title */}
      <motion.div
        variants={reducedMotion ? {} : itemVariants}
        className={`w-full text-left pt-2 border-t border-neutral-100 dark:border-neutral-900 ${isLocked ? 'opacity-40 select-none' : ''}`}
      >
        <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
          Sandbox Play (Free Practice)
        </h4>
      </motion.div>

      {/* Difficulty Cards */}
      <motion.div
        variants={reducedMotion ? {} : itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
      >
        {difficultyCards.map((card) => {
          const solvedCount =
            card.id === 'easy'
              ? stats.easySolved
              : card.id === 'medium'
              ? stats.mediumSolved
              : stats.hardSolved;

          const bestTime =
            card.id === 'easy'
              ? stats.bestEasyTime
              : card.id === 'medium'
              ? stats.bestMediumTime
              : stats.bestHardTime;

          return (
            <motion.div
              key={card.id}
              id={`difficulty-card-${card.id}`}
              onClick={isLocked ? undefined : () => onStartGame(card.id)}
              whileHover={isLocked || reducedMotion ? {} : { scale: 1.02, y: -3 }}
              whileTap={isLocked || reducedMotion ? {} : { scale: 0.985 }}
              className={`p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col justify-between space-y-6 transition-all duration-300 shadow-sm ${
                isLocked 
                  ? 'opacity-40 filter grayscale pointer-events-none select-none' 
                  : `cursor-pointer hover:shadow-md ${card.borderColor} ${card.bgHover}`
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 ${card.clueColor}`}>
                    {card.gridSize}
                  </span>
                  {solvedCount > 0 ? (
                    <span className="flex items-center text-xs text-emerald-500/90 font-medium">
                      <Check className="w-3.5 h-3.5 mr-0.5" /> Solved
                    </span>
                  ) : isLocked ? (
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 flex items-center gap-0.5 uppercase tracking-wide">
                      🔒 Locked
                    </span>
                  ) : null}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {card.title}
                </h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-normal">
                  {card.description}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900/60 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
                <div className="flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-neutral-300 dark:text-neutral-700" />
                  <span>Solved: <strong className="font-semibold text-neutral-700 dark:text-neutral-300">{solvedCount}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Timer className="w-4 h-4 text-neutral-300 dark:text-neutral-700" />
                  <span>Best: <strong className="font-semibold text-neutral-700 dark:text-neutral-300">{formatTime(bestTime)}</strong></span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tutorial Banner (Only shown below Hard Sandbox if completed) */}
      {hasCompletedTutorial && (
        <motion.div
          variants={reducedMotion ? {} : itemVariants}
          className="w-full"
        >
          {tutorialCard}
        </motion.div>
      )}

      {/* Stats Counter Shelf */}
      <motion.div 
        id="stats-shelf"
        variants={reducedMotion ? {} : itemVariants}
        className="w-full p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 flex flex-wrap gap-6 items-center justify-around text-center py-6 shadow-sm animate-fade-in"
      >
        <div className="flex flex-col items-center">
          <motion.div
            key={`current-streak-${stats.currentStreak}`}
            initial={reducedMotion ? { opacity: 0.6 } : { scale: 0.7, y: 3 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={reducedMotion ? { duration: 0.15 } : { type: 'spring', duration: 0.4, stiffness: 300, damping: 12 }}
            className="flex items-center text-amber-500 font-bold space-x-1"
          >
            <Zap className="w-5 h-5 fill-amber-500" />
            <span className="text-3xl text-neutral-900 dark:text-white tracking-tight">{stats.currentStreak}</span>
          </motion.div>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider mt-1">Current Streak</span>
        </div>

        <div className="h-8 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

        <div className="flex flex-col items-center">
          <motion.div
            key={`best-streak-${stats.bestStreak}`}
            initial={reducedMotion ? { opacity: 0.6 } : { scale: 0.7, y: 3 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={reducedMotion ? { duration: 0.15 } : { type: 'spring', duration: 0.4, stiffness: 300, damping: 12 }}
            className="flex items-center text-rose-500 font-bold space-x-1"
          >
            <Award className="w-5 h-5 fill-rose-500/20" />
            <span className="text-3xl text-neutral-900 dark:text-white tracking-tight">{stats.bestStreak}</span>
          </motion.div>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider mt-1">Highest Streak</span>
        </div>

        <div className="h-8 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

        <div className="flex flex-col items-center">
          <span className="text-3xl text-neutral-900 dark:text-white font-bold tracking-tight">
            {(stats.easySolved || 0) + (stats.mediumSolved || 0) + (stats.hardSolved || 0)}
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider mt-1">Total Completed</span>
        </div>
      </motion.div>

      {/* Performance Analytics Dashboard Card */}
      <motion.div 
        id="performance-dashboard-box"
        variants={reducedMotion ? {} : itemVariants}
        className="w-full p-5 md:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col gap-5 shadow-sm text-left font-sans"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#007AFF] dark:text-[#0A84FF]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                Performance Dashboard
              </h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">
                Track completion speed trends across sandbox difficulties over time.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl w-full sm:w-auto overflow-x-auto shrink-0 select-none">
            {(['all', 'easy', 'medium', 'hard'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-1 sm:flex-none px-3  py-1.5 text-[11px] font-bold uppercase rounded-lg tracking-wider transition-all duration-150 cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-white dark:bg-neutral-800 shadow-sm text-[#007AFF] dark:text-white'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {filter === 'all' ? 'Overall' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Visualization Area */}
        <div className="w-full pt-1">
          {chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/20 dark:bg-neutral-950/20">
              <BarChart2 className="w-10 h-10 text-neutral-300 dark:text-neutral-700 animate-pulse" />
              <div>
                <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">No matching completion times</span>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-xs mt-1 leading-normal">
                  Solve a sandbox game or level on <strong className="font-semibold capitalize">{activeFilter}</strong> difficulty to map your speed.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 md:h-72 w-full pr-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="performanceGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeColor} stopOpacity={0.16} />
                      <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="dateStr" 
                    stroke="#888888" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={formatYAxisTime}
                    dx={-6}
                  />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: 'rgba(128, 128, 128, 0.15)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="time"
                    stroke={activeColor}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#performanceGlow)"
                    activeDot={{ r: 5, strokeWidth: 1.5, stroke: '#FFFFFF' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
