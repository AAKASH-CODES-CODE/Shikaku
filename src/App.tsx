import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, CheckCircle2, AlertTriangle, HelpCircle, ArrowLeft, Play, Save, Settings, Users, Shield, Power, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Menu from './components/Menu';
import ShikakuGrid from './components/ShikakuGrid';
import Toolbar from './components/Toolbar';
import WinModal from './components/WinModal';
import LeaderboardModal from './components/LeaderboardModal';
import SettingsModal from './components/SettingsModal';
import PlayerProfileModal from './components/PlayerProfileModal';
import AdminModal from './components/AdminModal';
import { generateLevel } from './utils/shikakuGenerator';
import { BoardRectangle, Difficulty, LevelData } from './types';
import { sfx } from './utils/audio';
import { getGoogleProfile, uploadUserProgress, fetchUserProgress, ensureAnonymousUser, auth } from './utils/leaderboardService';

// Symmetrical 4x4 Tutorial Level Data
const TUTORIAL_LEVEL: LevelData = {
  difficulty: 'easy',
  width: 4,
  height: 4,
  cells: [
    { x: 0, y: 0, number: 4 },
    { x: 1, y: 0, number: null },
    { x: 2, y: 0, number: null },
    { x: 3, y: 0, number: 4 },
    { x: 0, y: 1, number: null },
    { x: 1, y: 1, number: null },
    { x: 2, y: 1, number: null },
    { x: 3, y: 1, number: null },
    { x: 0, y: 2, number: null },
    { x: 1, y: 2, number: null },
    { x: 2, y: 2, number: 4 },
    { x: 3, y: 2, number: null },
    { x: 0, y: 3, number: null },
    { x: 1, y: 3, number: 4 },
    { x: 2, y: 3, number: null },
    { x: 3, y: 3, number: null },
  ],
  solutionclues: [
    { x: 0, y: 0, area: 4 },
    { x: 3, y: 0, area: 4 },
    { x: 2, y: 2, area: 4 },
    { x: 1, y: 3, area: 4 },
  ],
  solutionRectangles: [
    { startX: 0, startY: 0, endX: 1, endY: 1, clueX: 0, clueY: 0, area: 4 },
    { startX: 2, startY: 0, endX: 3, endY: 1, clueX: 3, clueY: 0, area: 4 },
    { startX: 0, startY: 2, endX: 3, endY: 2, clueX: 2, clueY: 2, area: 4 },
    { startX: 0, startY: 3, endX: 3, endY: 3, clueX: 1, clueY: 3, area: 4 },
  ],
};

// Default stats object
const INITIAL_STATS = {
  easySolved: 3,
  mediumSolved: 2,
  hardSolved: 0,
  bestEasyTime: 45 as number | null,
  bestMediumTime: 112 as number | null,
  bestHardTime: null as number | null,
  currentStreak: 2,
  bestStreak: 3,
  history: [
    { id: '1', timestamp: Date.now() - 5 * 24 * 3600 * 1000, dateStr: '05/21 12:30', difficulty: 'easy', time: 72 },
    { id: '2', timestamp: Date.now() - 4 * 24 * 3600 * 1000, dateStr: '05/22 15:45', difficulty: 'easy', time: 54 },
    { id: '3', timestamp: Date.now() - 3 * 24 * 3600 * 1000, dateStr: '05/23 10:15', difficulty: 'medium', time: 140 },
    { id: '4', timestamp: Date.now() - 2 * 24 * 3600 * 1000, dateStr: '05/24 18:20', difficulty: 'easy', time: 45 },
    { id: '5', timestamp: Date.now() - 1 * 24 * 3600 * 1000, dateStr: '05/25 09:10', difficulty: 'medium', time: 112 },
  ] as Array<{ id: string; timestamp: number; dateStr: string; difficulty: string; time: number }>,
};

export default function App() {
  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'tutorial'>('menu');
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [levelNumber, setLevelNumber] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [boardRectangles, setBoardRectangles] = useState<BoardRectangle[]>([]);
  const [timer, setTimer] = useState<number>(0);

  // Daily Challenge state
  const [isDailyChallenge, setIsDailyChallenge] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [justCompletedTime, setJustCompletedTime] = useState<number | null>(null);

  const [todayDateStr] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const dailyDifficulty: Difficulty = (() => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday, 1 is Monday ...
    if (day === 1) return 'easy';
    if (day === 2 || day === 4 || day === 6) return 'medium';
    return 'hard';
  })();

  const [dailyCompleted, setDailyCompleted] = useState<boolean>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return localStorage.getItem(`shikaku_daily_completed_${dateStr}`) === 'true';
  });

  // Undo/Redo stacks
  const [historyStack, setHistoryStack] = useState<BoardRectangle[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardRectangle[][]>([]);

  // User Preferences
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return localStorage.getItem('shikaku_reduced_motion') === 'true';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(getGoogleProfile());
  const [campaignLevel, setCampaignLevel] = useState<number>(() => {
    const saved = localStorage.getItem('shikaku_campaign_level');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [isCampaignMode, setIsCampaignMode] = useState<boolean>(false);

  // Statistics
  const [stats, setStats] = useState(INITIAL_STATS);

  const syncWithServer = async (profile: any) => {
    if (!profile || !profile.userId) return;
    try {
      const remote = await fetchUserProgress(profile.userId);
      const localLvl = localStorage.getItem('shikaku_campaign_level');
      const currentLocalLvl = localLvl ? parseInt(localLvl, 10) : 1;

      let currentLocalStats = INITIAL_STATS;
      const localStatsStr = localStorage.getItem('shikaku_stats');
      if (localStatsStr) {
        try {
          currentLocalStats = JSON.parse(localStatsStr);
        } catch (err) {}
      }

      if (remote && remote.exists) {
        // Option 2: Overwrite local state with exact server copy (no mixing or bleed from prior accounts)
        const targetLvl = remote.campaignLevel || 1;
        setCampaignLevel(targetLvl);
        localStorage.setItem('shikaku_campaign_level', String(targetLvl));

        // Sync Daily Completed dates (clear local daily keys first to prevent user leak)
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('shikaku_daily_completed_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) {}

        if (Array.isArray(remote.dailyChallengesCompleted)) {
          remote.dailyChallengesCompleted.forEach((dateStr: string) => {
            localStorage.setItem(`shikaku_daily_completed_${dateStr}`, 'true');
          });
          if (remote.dailyChallengesCompleted.includes(todayDateStr)) {
            setDailyCompleted(true);
          } else {
            setDailyCompleted(false);
          }
        } else {
          setDailyCompleted(false);
        }

        // Overwrite stats with exact server copies to prevent timing/history leaks
        const targetStats = remote.stats || INITIAL_STATS;
        setStats(targetStats);
        localStorage.setItem('shikaku_stats', JSON.stringify(targetStats));

        // Confirm sync back to server so clean profile copy is maintained
        await uploadUserProgress(profile.userId, targetLvl, targetStats);
      } else {
        // If there's no progress on the server yet, populate it with current local state
        await uploadUserProgress(profile.userId, currentLocalLvl, currentLocalStats);
      }
    } catch (e) {
      console.error("Error running user sync with server database:", e);
    }
  };

  useEffect(() => {
    // 1. Initial Load of Google profile from storage
    const profile = getGoogleProfile();
    setUserProfile(profile);

    // 2. Register Firebase Auth state change listener to wait for session load/restore
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Firebase Auth loaded user session:", firebaseUser.uid, "Anonymous:", firebaseUser.isAnonymous);
        try {
          const remote = await fetchUserProgress(firebaseUser.uid);
          if (remote && remote.exists) {
            const targetLvl = remote.campaignLevel || 1;
            setCampaignLevel(targetLvl);
            localStorage.setItem('shikaku_campaign_level', String(targetLvl));

            // Sync daily checks
            try {
              const keysToRemove: string[] = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('shikaku_daily_completed_')) {
                  keysToRemove.push(key);
                }
              }
              keysToRemove.forEach(k => localStorage.removeItem(k));
            } catch (e) {}

            if (Array.isArray(remote.dailyChallengesCompleted)) {
              remote.dailyChallengesCompleted.forEach((dateStr: string) => {
                localStorage.setItem(`shikaku_daily_completed_${dateStr}`, 'true');
              });
              if (remote.dailyChallengesCompleted.includes(todayDateStr)) {
                setDailyCompleted(true);
              } else {
                setDailyCompleted(false);
              }
            } else {
              setDailyCompleted(false);
            }

            const targetStats = remote.stats || INITIAL_STATS;
            setStats(targetStats);
            localStorage.setItem('shikaku_stats', JSON.stringify(targetStats));

            // Keep in sync
            await uploadUserProgress(firebaseUser.uid, targetLvl, targetStats);
          }
        } catch (err) {
          console.error("Firebase auth state change progress load failed:", err);
        }
      }
    });

    // 3. Custom event listener for explicit identity actions
    const handler = () => {
      const updatedProfile = getGoogleProfile();
      setUserProfile((prevProfile) => {
        if (prevProfile && !updatedProfile) {
          // Explicit Google logout: Reset states back to clean level 1/initial stats defaults immediately
          setCampaignLevel(1);
          setStats(INITIAL_STATS);
          setDailyCompleted(false);
        } else if (!prevProfile && updatedProfile) {
          // Google login
          syncWithServer(updatedProfile);
        }
        return updatedProfile;
      });
    };
    window.addEventListener('shikaku_auth_changed', handler);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('shikaku_auth_changed', handler);
    };
  }, [todayDateStr]);

  // Hint & Winning Cascade visual controls
  const [hintFlashRect, setHintFlashRect] = useState<BoardRectangle | null>(null);
  const [isWinningCascade, setIsWinningCascade] = useState<boolean>(false);
  const [cascadeIndex, setCascadeIndex] = useState<number>(-1);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);

  // Victory screen shake and particle explosion states
  interface WinParticle {
    id: number;
    color: string;
    size: number;
    tx: number;
    ty: number;
    delay: number;
    rotation: number;
  }
  const [winParticles, setWinParticles] = useState<WinParticle[]>([]);
  const [isGridShaking, setIsGridShaking] = useState<boolean>(false);

  // Interval Ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Game Save Notification Toast State
  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<'none' | 'back-to-menu' | 'exit-app' | 'tutorial-back'>('none');
  const [isExited, setIsExited] = useState<boolean>(false);
  const [inactivitySeconds, setInactivitySeconds] = useState<number>(0);

  // Monitor hardware/browser popstate back events
  useEffect(() => {
    if (isExited) return;

    window.history.pushState({ page: 'shikaku' }, '');

    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState({ page: 'shikaku' }, '');

      if (showConfirmModal !== 'none') {
        setShowConfirmModal('none');
        return;
      }

      if (gameState === 'playing') {
        setShowConfirmModal('back-to-menu');
      } else if (gameState === 'tutorial') {
        setShowConfirmModal('tutorial-back');
      } else if (gameState === 'menu') {
        setShowConfirmModal('exit-app');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [gameState, showConfirmModal, isExited]);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerGameSaveToast = () => {
    if (gameState !== 'playing') return;
    setShowSavedNotification(false);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setTimeout(() => {
      setShowSavedNotification(true);
      toastTimeoutRef.current = setTimeout(() => {
        setShowSavedNotification(false);
      }, 1500); // 1.5s duration is brief and subtle
    }, 50);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // 1. Initial configuration load (Theme, Solved records, Resumable state)
  useEffect(() => {
    // Theme Preference
    const storedTheme = localStorage.getItem('shikaku_dark_mode');
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'true');
    } else {
      // Default to crisp light theme, but check system settings
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    // Muted Preference
    const storedMuted = localStorage.getItem('shikaku_muted');
    if (storedMuted) {
      setIsMuted(storedMuted === 'true');
    }

    // Stats
    const storedStats = localStorage.getItem('shikaku_stats');
    if (storedStats) {
      try {
        const parsed = JSON.parse(storedStats);
        if (!parsed.history || !Array.isArray(parsed.history)) {
          parsed.history = [
            { id: '1', timestamp: Date.now() - 5 * 24 * 3600 * 1000, dateStr: '05/21 12:30', difficulty: 'easy', time: 72 },
            { id: '2', timestamp: Date.now() - 4 * 24 * 3600 * 1000, dateStr: '05/22 15:45', difficulty: 'easy', time: 54 },
            { id: '3', timestamp: Date.now() - 3 * 24 * 3600 * 1000, dateStr: '05/23 10:15', difficulty: 'medium', time: 140 },
            { id: '4', timestamp: Date.now() - 2 * 24 * 3600 * 1000, dateStr: '05/24 18:20', difficulty: 'easy', time: 45 },
            { id: '5', timestamp: Date.now() - 1 * 24 * 3600 * 1000, dateStr: '05/25 09:10', difficulty: 'medium', time: 112 },
          ];
        }
        setStats(parsed);
      } catch (e) {
        console.error('Failed to parse statistics', e);
      }
    }

    // Check Resumable Saved Game
    const savedStateStr = localStorage.getItem('shikaku_resumable_state');
    if (savedStateStr) {
      try {
        const saved = JSON.parse(savedStateStr);
        if (saved && saved.levelData) {
          setLevelNumber(saved.levelNumber || 1);
          setDifficulty(saved.difficulty || 'easy');
          setLevelData(saved.levelData);
          setBoardRectangles(saved.boardRectangles || []);
          setTimer(saved.timer || 0);
          setHistoryStack(saved.historyStack || []);
          setRedoStack(saved.redoStack || []);
          setGameState('playing');
        }
      } catch (e) {
        console.error('Failed to restore saved game session', e);
      }
    }
  }, []);

  // Sync Dark Mode Class to document element
  useEffect(() => {
    localStorage.setItem('shikaku_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync Muted preferences
  useEffect(() => {
    localStorage.setItem('shikaku_muted', String(isMuted));
  }, [isMuted]);

  // Save current dynamic state to prevent loss of state on window close
  useEffect(() => {
    if (gameState === 'playing' && levelData && !isWinningCascade) {
      const stateToSave = {
        levelNumber,
        difficulty,
        timer,
        boardRectangles,
        levelData,
        historyStack,
        redoStack,
      };
      localStorage.setItem('shikaku_resumable_state', JSON.stringify(stateToSave));
    } else if (gameState === 'menu' || showWinModal) {
      localStorage.removeItem('shikaku_resumable_state');
    }
  }, [gameState, levelNumber, difficulty, timer, boardRectangles, levelData, historyStack, redoStack, isWinningCascade, showWinModal]);

  // 2. Timer Loop
  useEffect(() => {
    if (gameState === 'playing' && !isWinningCascade && !showWinModal) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState, isWinningCascade, showWinModal]);

  // 2b. Inactivity Auto-Hint Timer Loop
  useEffect(() => {
    if (gameState !== 'playing' || isWinningCascade || showWinModal) {
      setInactivitySeconds(0);
      return;
    }

    const resetInactivity = () => {
      setInactivitySeconds(0);
    };

    // Monitor clicks, movement, keys, or touches anywhere to keep track of activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivity, { passive: true });
    });

    const interval = setInterval(() => {
      setInactivitySeconds((prev) => {
        const next = prev + 1;
        if (next >= 30) {
          handleHint();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivity);
      });
    };
  }, [gameState, isWinningCascade, showWinModal, boardRectangles]);

  // 3. Auto-detect logical Shikaku victory state on changes in boardRectangles
  useEffect(() => {
    if (gameState === 'menu' || boardRectangles.length === 0 || isWinningCascade || showWinModal) return;

    if (gameState === 'playing' && !levelData) return;

    const currentWidth = gameState === 'tutorial' ? TUTORIAL_LEVEL.width : levelData!.width;
    const currentHeight = gameState === 'tutorial' ? TUTORIAL_LEVEL.height : levelData!.height;

    const totalGridArea = currentWidth * currentHeight;

    // Check 1: All cells must be segmented exactly once without overlaps
    const coverageGrid = new Array(totalGridArea).fill(false);
    let overlapDetected = false;
    let sumRectArea = 0;

    for (const rect of boardRectangles) {
      // Overlap calculation
      for (let y = rect.startY; y <= rect.endY; y++) {
        for (let x = rect.startX; x <= rect.endX; x++) {
          const idx = y * currentWidth + x;
          if (idx >= 0 && idx < totalGridArea) {
            if (coverageGrid[idx]) {
              overlapDetected = true;
            }
            coverageGrid[idx] = true;
          }
        }
      }
      sumRectArea += rect.area;
    }

    const isFullyCovered = coverageGrid.every((cellOccupied) => cellOccupied === true);

    // Check 2: Every single rectangle must be valid (one clue, area matches)
    const allRectanglesValid = boardRectangles.every((r) => r.isValid === true);

    // Win triggers ONLY when fully covered, valid, with no overlaps, and summation matches exactly
    if (isFullyCovered && allRectanglesValid && !overlapDetected && sumRectArea === totalGridArea) {
      if (gameState === 'tutorial') {
        if (tutorialStep === 4) {
          setTutorialStep(5);
          sfx.playWinCascade(isMuted);
        }
      } else {
        triggerWinCascadeAnimation();
      }
    }
  }, [boardRectangles, levelData, gameState, tutorialStep, isWinningCascade, showWinModal]);

  const triggerScreenShake = () => {
    setIsGridShaking(true);
    setTimeout(() => {
      setIsGridShaking(false);
    }, 500);
  };

  const triggerParticleExplosion = () => {
    const colors = [
      '#FF3B30', // Red
      '#FF9500', // Orange
      '#FFCC00', // Yellow/Gold
      '#34C759', // Green
      '#007AFF', // Blue
      '#AF52DE', // Purple
      '#FF2D55', // Pink
      '#5856D6', // Indigo
    ];

    const newParticles: WinParticle[] = [];
    for (let i = 0; i < 65; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 180;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      newParticles.push({
        id: Date.now() + i,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        tx,
        ty,
        delay: Math.random() * 0.15,
        rotation: Math.random() * 360 + 180,
      });
    }
    setWinParticles(newParticles);

    setTimeout(() => {
      setWinParticles([]);
    }, 1600);
  };

  // Cascading wave win animation
  const triggerWinCascadeAnimation = () => {
    setIsWinningCascade(true);
    setCascadeIndex(-1);
    sfx.playWinCascade(isMuted);

    // Call screen shake and particles explosion effects immediately on win placements
    if (!reducedMotion) {
      triggerScreenShake();
      triggerParticleExplosion();
    }

    localStorage.removeItem('shikaku_resumable_state');

    // Light up rectangles sequentially
    let idx = -1;
    const interval = setInterval(() => {
      idx++;
      if (idx < boardRectangles.length) {
        setCascadeIndex(idx);
      } else {
        clearInterval(interval);
        // Cascade concludes, update achievements and open modal after a brief pause
        setTimeout(() => {
          awardVictoryAchievements();
        }, 500);
      }
    }, 130);
  };

  const awardVictoryAchievements = () => {
    // Increment specific difficulty counters
    const isEasy = difficulty === 'easy';
    const isMedium = difficulty === 'medium';

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${mm}/${dd} ${hh}:${min}`;

    const newHistoryEntry = {
      id: String(Date.now()),
      timestamp: Date.now(),
      dateStr: formattedDate,
      difficulty: difficulty,
      time: timer,
    };

    const updatedStats = {
      ...stats,
      easySolved: stats.easySolved + (isEasy ? 1 : 0),
      mediumSolved: stats.mediumSolved + (isMedium ? 1 : 0),
      hardSolved: stats.hardSolved + (!isEasy && !isMedium ? 1 : 0),
      currentStreak: stats.currentStreak + 1,
      bestStreak: Math.max(stats.bestStreak, stats.currentStreak + 1),
      history: [...(stats.history || []), newHistoryEntry],
    };

    // Calculate best record time
    if (isEasy) {
      if (stats.bestEasyTime === null || timer < stats.bestEasyTime) {
        updatedStats.bestEasyTime = timer;
      }
    } else if (isMedium) {
      if (stats.bestMediumTime === null || timer < stats.bestMediumTime) {
        updatedStats.bestMediumTime = timer;
      }
    } else {
      if (stats.bestHardTime === null || timer < stats.bestHardTime) {
        updatedStats.bestHardTime = timer;
      }
    }

    setStats(updatedStats);
    localStorage.setItem('shikaku_stats', JSON.stringify(updatedStats));

    if (isCampaignMode) {
      const nextLevel = campaignLevel + 1;
      setCampaignLevel(nextLevel);
      localStorage.setItem('shikaku_campaign_level', String(nextLevel));
    }

    if (isDailyChallenge) {
      localStorage.setItem(`shikaku_daily_completed_${todayDateStr}`, 'true');
      setDailyCompleted(true);
      setJustCompletedTime(timer);
      setIsLeaderboardOpen(true);
    }

    if (userProfile && userProfile.userId) {
      const nextLevel = isCampaignMode ? campaignLevel + 1 : campaignLevel;
      uploadUserProgress(userProfile.userId, nextLevel, updatedStats);
    }

    setShowWinModal(true);
  };

  // 4. Controller Handlers for Actions
  const handleStartTutorial = () => {
    setIsDailyChallenge(false);
    setIsCampaignMode(false);
    setJustCompletedTime(null);
    setGameState('tutorial');
    setTutorialStep(0);
    setBoardRectangles([]);
    setHistoryStack([]);
    setRedoStack([]);
    setTimer(0);
    setHintFlashRect(null);
    setIsWinningCascade(false);
    setCascadeIndex(-1);
    setShowWinModal(false);
  };

  const handleStartNewGame = (selectedDiff: Difficulty) => {
    ensureAnonymousUser().catch(err => console.log("Lazy anonymous sign in deferred: ", err));

    setIsDailyChallenge(false);
    setIsCampaignMode(false);
    setJustCompletedTime(null);
    const freshLevel = generateLevel(selectedDiff);
    
    setDifficulty(selectedDiff);
    setLevelData(freshLevel);
    setBoardRectangles([]);
    setHistoryStack([]);
    setRedoStack([]);
    setTimer(0);
    setGameState('playing');
    setHintFlashRect(null);
    setIsWinningCascade(false);
    setCascadeIndex(-1);
    setShowWinModal(false);

    // Look up count of solved to match level numbering elegantly
    const matchCount =
      selectedDiff === 'easy'
        ? stats.easySolved
        : selectedDiff === 'medium'
        ? stats.mediumSolved
        : stats.hardSolved;
    setLevelNumber(matchCount + 1);
  };

  const handleStartCampaignLevel = (levelNum: number) => {
    ensureAnonymousUser().catch(err => console.log("Lazy anonymous sign in deferred: ", err));

    setIsDailyChallenge(false);
    setIsCampaignMode(true);
    setJustCompletedTime(null);
    
    // Symmetrical gradient progression of grids
    let selectedDiff: Difficulty = 'easy';
    if (levelNum >= 5 && levelNum <= 10) {
      selectedDiff = 'medium';
    } else if (levelNum > 10) {
      selectedDiff = 'hard';
    }
    
    const freshLevel = generateLevel(selectedDiff, `campaign_level_seed_${levelNum}`);
    
    setDifficulty(selectedDiff);
    setLevelData(freshLevel);
    setBoardRectangles([]);
    setHistoryStack([]);
    setRedoStack([]);
    setTimer(0);
    setGameState('playing');
    setHintFlashRect(null);
    setIsWinningCascade(false);
    setCascadeIndex(-1);
    setShowWinModal(false);
    setLevelNumber(levelNum);
  };

  const handleStartDailyChallenge = () => {
    ensureAnonymousUser().catch(err => console.log("Lazy anonymous sign in deferred: ", err));

    const seed = `${todayDateStr}_${dailyDifficulty}`;
    const freshLevel = generateLevel(dailyDifficulty, seed);

    setIsDailyChallenge(true);
    setIsCampaignMode(false);
    setJustCompletedTime(null);
    setDifficulty(dailyDifficulty);
    setLevelData(freshLevel);
    setBoardRectangles([]);
    setHistoryStack([]);
    setRedoStack([]);
    setTimer(0);
    setGameState('playing');
    setHintFlashRect(null);
    setIsWinningCascade(false);
    setCascadeIndex(-1);
    setShowWinModal(false);
    setLevelNumber(1);
  };

  const handleAddRectangle = (newRect: BoardRectangle) => {
    if (gameState === 'tutorial') {
      if (tutorialStep === 1) {
        // Enforce drawing exactly the starting 2x2 box at (0,0) containing clue 4
        const isValidBox = newRect.startX === 0 && newRect.startY === 0 && newRect.endX === 1 && newRect.endY === 1;
        if (isValidBox) {
          setBoardRectangles([newRect]);
          setTutorialStep(2);
          sfx.playLockClick(isMuted);
          
          // Auto populate Step 2 invalid area mock rectangle on the top right
          setTimeout(() => {
            const wrongRect: BoardRectangle = {
              id: 'tutorial_invalid_area',
              startX: 2,
              startY: 0,
              endX: 3,
              endY: 0,
              width: 2,
              height: 1,
              area: 2,
              clueX: 3,
              clueY: 0,
              clueValue: 4,
              isValid: false,
              containsMultipleClues: false,
              hasWrongArea: true
            };
            setBoardRectangles((prev) => [...prev, wrongRect]);
          }, 400);
        } else {
          // Play thud for wrong target
          sfx.playErrorThud(isMuted);
        }
      } else if (tutorialStep === 2 || tutorialStep === 3) {
        // Disallow arbitrary drag to force click remove
        sfx.playErrorThud(isMuted);
      } else if (tutorialStep === 4) {
        // Free drawing to complete
        setHistoryStack((prev) => [...prev, boardRectangles]);
        setRedoStack([]);
        setBoardRectangles((prev) => [...prev, newRect]);
      }
      return;
    }

    // Support Undo history
    setHistoryStack((prev) => [...prev, boardRectangles]);
    setRedoStack([]); // Clear redo
    setBoardRectangles((prev) => [...prev, newRect]);
    triggerGameSaveToast();
  };

  const handleRemoveRectangle = (rectId: string) => {
    if (gameState === 'tutorial') {
      if (tutorialStep === 2 && rectId === 'tutorial_invalid_area') {
        setBoardRectangles((prev) => prev.filter((r) => r.id !== rectId));
        setTutorialStep(3);
        sfx.playLockClick(isMuted);
        
        // Auto populate Step 3 multi clue intersection mock rectangle (contains 4 at (2,2) and 4 at (1,3))
        setTimeout(() => {
          const wrongMulti: BoardRectangle = {
            id: 'tutorial_invalid_multi',
            startX: 1,
            startY: 2,
            endX: 2,
            endY: 3,
            width: 2,
            height: 2,
            area: 4,
            clueX: 2,
            clueY: 2,
            clueValue: 4,
            isValid: false,
            containsMultipleClues: true,
            hasWrongArea: false
          };
          setBoardRectangles((prev) => [...prev, wrongMulti]);
        }, 400);
      } else if (tutorialStep === 3 && rectId === 'tutorial_invalid_multi') {
        setBoardRectangles((prev) => prev.filter((r) => r.id !== rectId));
        setTutorialStep(4);
        sfx.playLockClick(isMuted);
      } else if (tutorialStep === 4) {
        setHistoryStack((prev) => [...prev, boardRectangles]);
        setRedoStack([]);
        setBoardRectangles((prev) => prev.filter((r) => r.id !== rectId));
      }
      return;
    }

    setHistoryStack((prev) => [...prev, boardRectangles]);
    setRedoStack([]);
    setBoardRectangles((prev) => prev.filter((r) => r.id !== rectId));
    triggerGameSaveToast();
  };

  const handleRestart = () => {
    if (boardRectangles.length === 0) return;
    setHistoryStack((prev) => [...prev, boardRectangles]);
    setRedoStack([]);
    setBoardRectangles([]);
    triggerGameSaveToast();
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const prevSnapshot = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, boardRectangles]);
    setBoardRectangles(prevSnapshot);
    triggerGameSaveToast();
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextSnapshot = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setHistoryStack((prev) => [...prev, boardRectangles]);
    setBoardRectangles(nextSnapshot);
    triggerGameSaveToast();
  };

  // Intelligent Hint System (Section 10)
  const handleHint = () => {
    if (!levelData) return;

    // Rule A: If user has drawn incorrect rectangles, highlight ONE and suggest removal
    const incorrectRect = boardRectangles.find((r) => !r.isValid);
    if (incorrectRect) {
      // Flash outline in yellow/orange and trigger haptic rumble to represent correct actions
      setHintFlashRect(incorrectRect);
      sfx.playErrorThud(isMuted);
      return;
    }

    // Rule B: If all current rects are correct, find ONE clue that has only ONE possible
    // logic remaining or simply reveal the Ground-Truth missing solution rectangle!
    const missingRect = levelData.solutionRectangles.find(
      (sol) =>
        !boardRectangles.some(
          (drawn) =>
            drawn.startX === sol.startX &&
            drawn.startY === sol.startY &&
            drawn.endX === sol.endX &&
            drawn.endY === sol.endY
        )
    );

    if (missingRect) {
      const simulatedRect: BoardRectangle = {
        id: 'hint_flash_rect',
        startX: missingRect.startX,
        startY: missingRect.startY,
        endX: missingRect.endX,
        endY: missingRect.endY,
        width: missingRect.endX - missingRect.startX + 1,
        height: missingRect.endY - missingRect.startY + 1,
        area: missingRect.area,
        clueX: missingRect.clueX,
        clueY: missingRect.clueY,
        clueValue: missingRect.area,
        isValid: true,
        containsMultipleClues: false,
        hasWrongArea: false,
      };

      setHintFlashRect(simulatedRect);
      sfx.playLockClick(isMuted);
    }
  };

  const handleBackToMenu = () => {
    if (gameState === 'playing') {
      setShowConfirmModal('back-to-menu');
    } else if (gameState === 'tutorial') {
      setShowConfirmModal('tutorial-back');
    } else {
      setGameState('menu');
      setHintFlashRect(null);
      setIsWinningCascade(false);
      setShowWinModal(false);
    }
  };

  return (
    <>
      {isExited && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-950 p-6 select-none animate-fade-in font-sans">
          <div className="bento-card max-w-sm w-full p-8 text-center flex flex-col items-center space-y-6 border border-neutral-200 dark:border-neutral-800 shadow-xl bg-white dark:bg-[#1C1C1E] rounded-3xl">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-950/20 text-red-500 animate-pulse">
              <Power className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-[#007AFF] dark:text-[#0A84FF] tracking-tight">
                Game Shutdown
              </h1>
              <p className="text-xs text-neutral-500 dark:text-[#8E8E93] leading-relaxed max-w-xs mx-auto mt-2">
                The Shikaku gaming instance has been terminated successfully. You can close this browser tab safely now, or relaunch below.
              </p>
            </div>
            
            <button
              onClick={() => {
                setIsExited(false);
                setGameState('menu');
              }}
              className="w-full py-3 bg-[#007AFF] hover:bg-[#0A84FF] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-[#007AFF]/10"
            >
              Relaunch Game
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col h-[100dvh] w-full overflow-hidden">
      {/* GLOBAL TOP CREDITS */}
      {gameState === 'menu' && (
        <div className="w-full text-center py-2 bg-neutral-100 dark:bg-[#1C1C1E] border-b border-neutral-200 dark:border-neutral-800 shrink-0 select-none z-50">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-neutral-500 dark:text-neutral-400 uppercase font-mono">
            Developed By Aakash
          </span>
        </div>
      )}

      <div id="shikaku-applet" className={`flex-1 min-h-0 overflow-y-auto w-full max-w-[1400px] mx-auto flex flex-col justify-between transition-colors duration-200 ${gameState === 'playing' ? 'p-2 md:p-4 lg:p-6' : 'p-4 md:p-6 lg:p-8'}`}>
      {gameState === 'playing' && levelData ? (
        <div className="flex flex-col h-full w-full gap-2 md:gap-4 lg:gap-6 items-center">
          {/* Header Card */}
          <div className="w-full shrink-0">
            <Header
              levelNumber={levelNumber}
              difficulty={difficulty}
              seconds={timer}
              onBack={handleBackToMenu}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isCampaignMode={isCampaignMode}
            />
          </div>

          <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-2 md:gap-4 lg:gap-6 justify-center">
             {/* Left Pods: Only show on desktop (lg) */}
             <div className="hidden lg:flex flex-col w-[260px] shrink-0 gap-6 overflow-y-auto pr-2 pb-2">
               <div className="bento-card p-5 md:p-6 flex flex-col justify-center shrink-0">
                 <span className="text-[10px] font-bold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase font-mono block">Objective</span>
                 <p className="text-xs leading-relaxed mt-2 text-neutral-600 dark:text-neutral-400 font-medium">
                   Divide the grid into rectangles. Each rectangle must contain exactly one number, and its area must match that number.
                 </p>
               </div>
               <div className="bento-card p-5 md:p-6 flex flex-col justify-center shrink-0">
                 <span className="text-[10px] font-bold tracking-widest text-[#8E8E93] dark:text-neutral-500 uppercase font-mono block">Progress Status</span>
                 <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2.5 rounded-full mt-4 overflow-hidden">
                   <div
                     className="bg-[#007AFF] dark:bg-[#0A84FF] h-full transition-all duration-300 rounded-full"
                     style={{ width: `${Math.min(100, Math.round((boardRectangles.reduce((acc, r) => acc + (r.isValid ? r.area : 0), 0) / (levelData.width * levelData.height)) * 100))}%` }}
                   ></div>
                 </div>
                 <div className="mt-4 flex justify-between text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400">
                   <span>
                     {Math.min(100, Math.round((boardRectangles.reduce((acc, r) => acc + (r.isValid ? r.area : 0), 0) / (levelData.width * levelData.height)) * 100))}% Filled
                   </span>
                   <span>
                     {boardRectangles.filter((r) => r.isValid).length} / {levelData.solutionRectangles.length} Rects
                   </span>
                 </div>
               </div>
             </div>

             {/* Center: Grid and Mobile Progress */}
             <div className="flex-1 min-h-0 min-w-0 flex flex-col gap-2 md:gap-4 lg:gap-6 justify-center items-center w-full">
                 {/* Mobile Progress Bar */}
                 <div className="lg:hidden w-full shrink-0 bento-card px-4 py-3 flex flex-col items-center justify-center gap-2">
                    <div className="flex w-full items-center justify-between text-[10px] uppercase font-bold font-mono text-neutral-500">
                         <span>Progress</span>
                         <span>{boardRectangles.filter((r) => r.isValid).length} / {levelData.solutionRectangles.length}</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#007AFF] dark:bg-[#0A84FF] h-full transition-all duration-300 rounded-full" 
                             style={{ width: `${Math.min(100, Math.round((boardRectangles.reduce((acc, r) => acc + (r.isValid ? r.area : 0), 0) / (levelData.width * levelData.height)) * 100))}%` }}>
                        </div>
                    </div>
                 </div>

                 {/* Grid */}
                 <motion.div
                   animate={isGridShaking && !reducedMotion ? {
                     x: [0, -6, 6, -6, 6, -3, 3, -1, 1, 0],
                     y: [0, 3, -3, 3, -3, 1.5, -1.5, 0.5, -0.5, 0]
                   } : { x: 0, y: 0 }}
                   transition={{ duration: 0.45, ease: "easeInOut" }}
                   className="flex-1 min-h-0 w-full bento-card p-1 md:p-3 flex flex-col items-center justify-center relative overflow-hidden"
                 >
                   {/* Particle Explosion Layer */}
                   {!reducedMotion && winParticles.map((p) => (
                     <motion.div
                       key={p.id}
                       initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
                       animate={{
                         x: p.tx,
                         y: p.ty,
                         scale: [1, 1.3, 0],
                         opacity: [1, 1, 0],
                         rotate: p.rotation,
                       }}
                       transition={{
                         duration: 1.3,
                         ease: "easeOut",
                         delay: p.delay,
                       }}
                       style={{
                         position: 'absolute',
                         left: '50%',
                         top: '50%',
                         width: p.size,
                         height: p.size,
                         borderRadius: p.id % 2 === 0 ? '50%' : '20%',
                         backgroundColor: p.color,
                         boxShadow: `0 0 8px ${p.color}80`,
                         pointerEvents: 'none',
                         zIndex: 40,
                       }}
                     />
                   ))}

                   <ShikakuGrid
                     width={levelData.width}
                     height={levelData.height}
                     cells={levelData.cells}
                     boardRectangles={boardRectangles}
                     onAddRectangle={handleAddRectangle}
                     onRemoveRectangle={handleRemoveRectangle}
                     isMuted={isMuted}
                     isDarkMode={isDarkMode}
                     hintFlashRect={hintFlashRect}
                     onClearHintFlash={() => setHintFlashRect(null)}
                     solutionRectangles={levelData.solutionRectangles}
                     isWinningCascade={isWinningCascade || showWinModal}
                     cascadeIndex={cascadeIndex}
                     reducedMotion={reducedMotion}
                   />
                 </motion.div>
             </div>

             {/* Right Pods: Only show on desktop (lg) */}
             <div className="hidden lg:flex flex-col w-[260px] shrink-0 gap-6 overflow-y-auto pr-2 pb-2">
                 <div className="bento-card p-5 md:p-6 flex flex-col justify-between flex-1 min-h-[200px]">
                   <div>
                     <span className="text-[10px] font-bold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase font-mono block">Real-time Move Log</span>
                     <div className="mt-4 space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                       {boardRectangles.length === 0 ? (
                         <div className="text-xs text-neutral-400 dark:text-neutral-500 italic py-2">
                           No subdivisions drawn yet. Drag cells to partition rectangles.
                         </div>
                       ) : (
                         boardRectangles.map((rect) => (
                           <div key={rect.id} className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-neutral-100 dark:border-neutral-900/60 last:border-0">
                             <div className="flex items-center">
                               <div className={`w-2 h-2 rounded-full mr-2 ${rect.isValid ? 'bg-[#007AFF] dark:bg-[#0A84FF]' : 'bg-[#FF3B30] dark:bg-[#FF453A]'}`} />
                               <span className="text-neutral-500 dark:text-neutral-450 font-medium">Rect ({rect.startX + 1},{rect.startY + 1}) &bull; {rect.area}</span>
                             </div>
                             <span className={`font-semibold uppercase text-[10px] ${rect.isValid ? 'text-neutral-400' : 'text-[#FF3B30] dark:text-[#FF453A]'}`}>
                               {rect.isValid ? 'Fine' : 'Wrong'}
                             </span>
                           </div>
                         ))
                       )}
                     </div>
                   </div>
                 </div>

                 <div className="bento-card p-5 md:p-6 shrink-0">
                   <span className="text-[10px] font-bold tracking-widest text-[#8E8E93] dark:text-neutral-500 uppercase font-mono block">Streak Stats</span>
                   <div className="text-2xl font-bold font-sans tracking-tight text-neutral-900 dark:text-white mt-1 tabular-nums">
                     {stats.currentStreak} 🔥
                   </div>
                   <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono tracking-wider block mt-0.5">
                     Highest session streak: {stats.bestStreak}
                   </span>
                 </div>
             </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="w-full shrink-0 max-w-4xl mx-auto">
            <Toolbar
              onRestart={handleRestart}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onHint={handleHint}
              canUndo={historyStack.length > 0}
              canRedo={redoStack.length > 0}
              canRestart={boardRectangles.length > 0}
              disabledAll={isWinningCascade || showWinModal}
              reducedMotion={reducedMotion}
              inactivitySeconds={inactivitySeconds}
            />
          </div>
        </div>
      ) : gameState === 'tutorial' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr_280px] gap-6 w-full items-start">
          {/* Header Card Spanning Top */}
          <div className="col-span-1 lg:col-span-2 xl:col-span-3">
            <header className="w-full bento-card p-5 md:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 select-none z-40 transition-all">
              <div className="flex items-center space-x-4">
                <button
                  id="btn-back-tutorial"
                  onClick={handleBackToMenu}
                  className="p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase font-mono block">
                    Interactive Academy
                  </span>
                  <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mt-0.5 tracking-tight font-sans text-[#007AFF] dark:text-[#0A84FF]">
                    Shikaku Tutorial 🎓
                  </h1>
                </div>
              </div>

              {/* Central Premium Interactive Progress Bar */}
              <div className="flex-1 max-w-xl mx-0 md:mx-4 flex flex-col justify-center gap-1.5 py-1 px-3 bg-neutral-50/50 dark:bg-neutral-950/20 border border-neutral-200/60 dark:border-neutral-800/80 rounded-2xl">
                <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                  <span className="text-[#007AFF] dark:text-[#0A84FF]">
                    TUTORIAL COMPLETION: {Math.round((tutorialStep / 5) * 100)}%
                  </span>
                  <span className="text-neutral-450 dark:text-neutral-500">
                    {5 - tutorialStep === 0 
                      ? '✨ ALL STEPS COMPLETED!' 
                      : `${5 - tutorialStep} step${5 - tutorialStep > 1 ? 's' : ''} remaining`}
                  </span>
                </div>
                
                {/* Custom Segmented Tracker capsules */}
                <div className="flex gap-1.5 h-2.5 w-full items-center">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const isCompleted = index < tutorialStep;
                    const isActive = index === tutorialStep;
                    return (
                      <div
                        key={index}
                        className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                          isCompleted 
                            ? 'bg-[#007AFF] dark:bg-[#0A84FF] shadow-[0_0_10px_rgba(0,122,255,0.2)]' 
                            : isActive 
                            ? 'bg-[#007AFF] dark:bg-[#0A84FF] animate-pulse h-2.5 ring-2 ring-blue-100 dark:ring-blue-900/40' 
                            : 'bg-neutral-200 dark:bg-neutral-800'
                        }`}
                        title={`Step ${index + 1}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={handleBackToMenu}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-350 cursor-pointer"
                >
                  Quit Tutorial
                </button>
              </div>
            </header>
          </div>

          {/* Left Column: Interactive Dialog and Guideline Box */}
          <div className="bento-card p-5 md:p-6 flex flex-col justify-between bg-gradient-to-br from-blue-50/20 to-neutral-50 dark:from-blue-950/10 dark:to-neutral-950/20 border-blue-150 dark:border-blue-900 min-h-[350px]">
            <div>
              <div className="flex justify-between items-center mb-4 font-sans">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-widest text-[#007AFF] dark:text-[#0A84FF] font-mono uppercase">
                    Step {tutorialStep + 1} of 6
                  </span>
                  <span className="text-[9px] font-bold font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {5 - tutorialStep === 0 ? '✨ Completed!' : `${5 - tutorialStep} step${5 - tutorialStep > 1 ? 's' : ''} remaining`}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-100/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  {tutorialStep === 0 && 'Welcome'}
                  {tutorialStep === 1 && 'First Rect'}
                  {tutorialStep === 2 && 'Area Error'}
                  {tutorialStep === 3 && 'Clue Collision'}
                  {tutorialStep === 4 && 'Test Drive'}
                  {tutorialStep === 5 && 'Verified'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight mb-2.5 leading-snug">
                {tutorialStep === 0 && 'Welcome to Shikaku! 🧩'}
                {tutorialStep === 1 && 'Draw Your First Rectangle'}
                {tutorialStep === 2 && 'Checking Invalid Areas (Red)'}
                {tutorialStep === 3 && 'No Clue Collisions! (Red)'}
                {tutorialStep === 4 && 'Complete the Puzzle!'}
                {tutorialStep === 5 && 'Outstanding Job! 🎉'}
              </h3>

              <div className="text-xs text-neutral-600 dark:text-neutral-450 leading-relaxed space-y-3 font-medium">
                {tutorialStep === 0 && (
                  <>
                    <p>Shikaku is a famous rectangular logic puzzle. Your quest is simple:</p>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100/45 dark:bg-neutral-900/45 p-2.5 rounded-xl border border-neutral-200/40 dark:border-neutral-800/65">
                      Segment the grid into rectangles. Every rectangle must enclose exactly ONE number, and its area must match that number.
                    </p>
                    <p className="font-normal text-neutral-400">Let's learn how to draw and edit in the next step!</p>
                  </>
                )}
                {tutorialStep === 1 && (
                  <>
                    <p>Notice the number clue "4" on the top-left cell <strong>(0,0)</strong>.</p>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Drag a 2x2 square starting from (0,0) down to the grid cell (1,1).
                    </p>
                    <p className="text-neutral-450 dark:text-neutral-500">
                      A valid rectangle contains exactly one clue, and its cell count is exactly 2 &times; 2 = 4 cells matching the clue!
                    </p>
                  </>
                )}
                {tutorialStep === 2 && (
                  <>
                    <p>Fantastic! You successfully drew your first rectangle.</p>
                    <p className="font-semibold text-[#FF3B30] dark:text-[#FF453A] bg-red-500/10 dark:bg-red-500/[0.04] p-3 rounded-xl border border-red-500/20">
                      Look at the Red rectangle: it contains the clue '4' but covers only 2 cells (area 2).
                    </p>
                    <p>Because its area is wrong, it turns Red. Let's fix this error:</p>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Click or tap directly on this Red rectangle to remove/clear it!
                    </p>
                  </>
                )}
                {tutorialStep === 3 && (
                  <>
                    <p>Great! You removed the invalid rectangle.</p>
                    <p className="font-semibold text-[#FF3B30] dark:text-[#FF453A] bg-red-500/10 dark:bg-red-500/[0.04] p-3 rounded-xl border border-red-500/20">
                      Now look at this new Red rectangle: it encloses two separate '4' clues (both (2,2) and (1,3)).
                    </p>
                    <p>This is illegal. A rectangle is strictly limited to exactly one clue cell.</p>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Click or tap on this multiple clue rectangle to delete it!
                    </p>
                  </>
                )}
                {tutorialStep === 4 && (
                  <>
                    <p>Incredible progress! You are now prepared.</p>
                    <p>The entire grid is now yours. Connect and partition the remaining clues:</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-neutral-500 dark:text-neutral-450">
                      <li>Clue "4" at (3,0) (hint: try a vertical 1x4 or horizontal grid rect)</li>
                      <li>Clue "4" at (2,2)</li>
                      <li>Clue "4" at (1,3)</li>
                    </ul>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Drag on cells to complete the 4x4 grid placement!
                    </p>
                  </>
                )}
                {tutorialStep === 5 && (
                  <>
                    <p>Congratulations! 🌟 You segmented the 4x4 grid with zero overlapping cells and correct proportions.</p>
                    <p>You have perfectly mastered the rules of Shikaku. Let's start a real game to test your logic skills!</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200/50 dark:border-neutral-800/60 flex items-center justify-between">
              {tutorialStep > 0 && tutorialStep < 5 && (
                <button
                  onClick={() => {
                    setTutorialStep((prev) => prev - 1);
                    setBoardRectangles([]);
                  }}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-900 font-semibold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Back Step
                </button>
              )}
              {tutorialStep === 0 && (
                <button
                  onClick={() => {
                    setTutorialStep(1);
                    setBoardRectangles([]);
                  }}
                  className="ml-auto px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-blue-600 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Start Practice &rarr;
                </button>
              )}
              {tutorialStep === 5 && (
                <button
                  onClick={handleBackToMenu}
                  className="w-full py-3 rounded-xl bg-[#007AFF] hover:bg-blue-600 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer text-center shadow-md animate-bounce"
                >
                  Complete & Go Home
                </button>
              )}
            </div>
          </div>

          {/* Central Tutorial Shikaku Grid (Sized beautifully) */}
          <div className="bento-card p-5 md:p-6 flex flex-col items-center justify-center relative min-h-[360px] lg:min-h-[460px]">
            {tutorialStep === 1 && (
              <div className="absolute top-2 left-2 animate-pulse bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 p-2.5 rounded-xl text-[11px] font-bold z-10 flex items-center space-x-1.5 border border-blue-200 dark:border-blue-800">
                <span>👈 Drag from Cell (0,0) down to (1,1)</span>
              </div>
            )}
            <ShikakuGrid
              width={TUTORIAL_LEVEL.width}
              height={TUTORIAL_LEVEL.height}
              cells={TUTORIAL_LEVEL.cells}
              boardRectangles={boardRectangles}
              onAddRectangle={handleAddRectangle}
              onRemoveRectangle={handleRemoveRectangle}
              isMuted={isMuted}
              isDarkMode={isDarkMode}
              hintFlashRect={hintFlashRect}
              onClearHintFlash={() => setHintFlashRect(null)}
              solutionRectangles={TUTORIAL_LEVEL.solutionRectangles}
              isWinningCascade={false}
              cascadeIndex={-1}
              reducedMotion={reducedMotion}
            />
          </div>

          {/* Right Pod: Rules Checklist & Progression */}
          <div className="flex flex-col gap-6 w-full lg:col-span-2 xl:col-span-1">
            <div className="bento-card p-5 md:p-6 flex flex-col justify-start">
              <span className="text-[10px] font-bold tracking-widest text-[#8E8E93] dark:text-neutral-500 uppercase font-mono block animate-pulse">Rules Checklist</span>
              <div className="mt-4 space-y-4">
                <div className="flex items-start">
                  <div className="mt-0.5 mr-2.5">
                    {boardRectangles.length > 0 ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">Single Clue Limit</span>
                    <span className="text-[10px] text-neutral-450 block mt-0.5">Every region houses exactly 1 number clue.</span>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="mt-0.5 mr-2.5">
                    {boardRectangles.some(r => r.isValid) ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">Area Matches Number</span>
                    <span className="text-[10px] text-neutral-450 block mt-0.5">Dimensions multiply matching its clue.</span>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="mt-0.5 mr-2.5">
                    {boardRectangles.length > 0 && !boardRectangles.some(r => !r.isValid) ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">Zero Overlaps</span>
                    <span className="text-[10px] text-neutral-450 block mt-0.5">No boundary overlaps other subsets.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-card p-5 md:p-6 bg-neutral-50/50 dark:bg-neutral-950/25 border border-dashed border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] font-bold tracking-widest text-[#007AFF] dark:text-[#0A84FF] uppercase font-mono block">Progression Progress</span>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-[#007AFF] dark:bg-[#0A84FF] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(tutorialStep / 5) * 100}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] font-bold font-mono text-neutral-450">
                {Math.round((tutorialStep / 5) * 100)}% Completed
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header layout for main menu selection screen */}
          <header className="w-full flex justify-between items-center px-6 py-4 border-b border-transparent">
            <div className="flex items-center gap-3">
              {userProfile ? (
                <div 
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-emerald-500/[0.05] dark:bg-emerald-500/[0.03] border border-emerald-500/25 rounded-full cursor-pointer hover:bg-emerald-500/[0.09] transition-all text-emerald-600 dark:text-emerald-400"
                >
                  {userProfile.picture ? (
                    <img 
                      src={userProfile.picture} 
                      alt={userProfile.name} 
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full border border-emerald-500/20"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px]">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[10px] font-bold font-mono tracking-tight">{userProfile.name}</span>
                </div>
              ) : (
                <div 
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800 rounded-full cursor-pointer transition-all text-neutral-500 dark:text-neutral-400"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-550 animate-pulse" />
                  <span className="text-[10px] font-bold font-mono tracking-tight uppercase">Guest Solver (Connect)</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                id="btn-menu-theme"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-white transition-all cursor-pointer"
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
              <button
                id="btn-menu-settings"
                onClick={() => setIsSettingsOpen(true)}
                title="Settings"
                aria-label="Settings"
                className="p-2.5 rounded-full text-neutral-400 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-white transition-all cursor-pointer"
              >
                <Settings className="w-4.5 h-4.5 text-neutral-500 dark:text-neutral-400" />
              </button>
              <button
                id="btn-menu-profile"
                onClick={() => setIsProfileOpen(true)}
                title="Player Profile"
                aria-label="Player Profile"
                className="p-2.5 rounded-full text-neutral-400 hover:text-orange-500 dark:text-neutral-500 dark:hover:text-orange-400 transition-all cursor-pointer"
              >
                <Users className="w-4.5 h-4.5" />
              </button>
              <button
                id="btn-menu-admin"
                onClick={() => setIsAdminOpen(true)}
                title="Admin Dashboard"
                aria-label="Admin Dashboard"
                className="p-2.5 rounded-full text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 transition-all cursor-pointer"
              >
                <Shield className="w-4.5 h-4.5" />
              </button>
              <button
                id="btn-menu-exit"
                onClick={() => setShowConfirmModal('exit-app')}
                title="Exit Game"
                aria-label="Exit Game"
                className="p-2.5 rounded-full text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 transition-all cursor-pointer"
              >
                <Power className="w-4.5 h-4.5 text-red-500" />
              </button>
            </div>
          </header>

          <main className="flex-grow flex items-center justify-center font-sans">
            <Menu
              onStartGame={handleStartNewGame}
              onStartTutorial={handleStartTutorial}
              onStartDailyChallenge={handleStartDailyChallenge}
              onViewLeaderboard={() => setIsLeaderboardOpen(true)}
              stats={stats}
              todayDateStr={todayDateStr}
              dailyDifficulty={dailyDifficulty}
              dailyCompleted={dailyCompleted}
              reducedMotion={reducedMotion}
              campaignLevel={campaignLevel}
              onStartCampaignLevel={handleStartCampaignLevel}
              onExitGame={() => setShowConfirmModal('exit-app')}
            />
          </main>

          <footer className="py-4 text-center text-[10px] font-mono tracking-widest text-[#007AFF] dark:text-[#0A84FF] select-none uppercase">
            Intelligent Bento Partitions • Shikaku
          </footer>
        </>
      )}

      {/* Settings Modal Layer */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => {
          const newValue = !reducedMotion;
          setReducedMotion(newValue);
          localStorage.setItem('shikaku_reduced_motion', String(newValue));
        }}
      />

      {/* Win Modal Layer */}
      <AnimatePresence>
        <WinModal
          isOpen={showWinModal}
          seconds={timer}
          streak={stats.currentStreak}
          difficulty={difficulty}
          onNext={() => isCampaignMode ? handleStartCampaignLevel(campaignLevel) : handleStartNewGame(difficulty)}
          onHome={handleBackToMenu}
          isDailyChallenge={isDailyChallenge}
          onViewLeaderboard={() => {
            setShowWinModal(false);
            setIsLeaderboardOpen(true);
          }}
          reducedMotion={reducedMotion}
        />
      </AnimatePresence>

      {/* Leaderboard Modal Layer */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => {
          setIsLeaderboardOpen(false);
          setJustCompletedTime(null);
        }}
        todayDateStr={todayDateStr}
        difficulty={dailyDifficulty}
        justCompletedTime={justCompletedTime}
        isMuted={isMuted}
        onScoreSubmitted={() => {
          setJustCompletedTime(null);
        }}
        reducedMotion={reducedMotion}
      />

      {/* Subtle Game Saved Toast */}
      <AnimatePresence>
        {showSavedNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95, transition: { duration: 0.12 } }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-900/95 dark:bg-neutral-800/95 text-white dark:text-neutral-100 rounded-xl shadow-lg border border-neutral-800 dark:border-neutral-700 font-sans text-xs font-semibold tracking-tight backdrop-blur-sm select-none"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Save className="w-3.5 h-3.5 text-neutral-400" />
              <span>Game Saved</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
      />
      
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* GLOBAL BOTTOM CREDITS */}
      {gameState === 'menu' && (
        <div className="w-full shrink-0 bg-neutral-100 dark:bg-[#1C1C1E] border-t border-neutral-200 dark:border-neutral-800 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-neutral-500 dark:text-neutral-400 font-medium select-none text-center z-50 mt-10">
          <div>Developer <span className="font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">Aakash kumar</span></div>
          <div className="hidden sm:block opacity-30 text-xs text-neutral-400">•</div>
          <div className="flex items-center gap-1.5">
            Insta <a href="https://instagram.com/_itz_akash_3" target="_blank" rel="noopener noreferrer" className="font-bold text-[#E1306C] hover:text-[#C13584] transition-colors hover:underline">_itz_akash_3</a>
          </div>
          <div className="hidden sm:block opacity-30 text-xs text-neutral-400">•</div>
          <div className="flex items-center gap-1.5">
            Email <a href="mailto:fake.akash07@gmail.com" className="font-bold text-orange-500 hover:text-orange-600 transition-colors hover:underline">fake.akash07@gmail.com</a>
          </div>
          <div className="hidden sm:block opacity-30 text-xs text-neutral-400">•</div>
          <div className="text-[10px] sm:text-xs">Version 1.0</div>
        </div>
      )}
      </div>{/* End of shikaku-applet */}
    </div>

    {/* CUSTOM BACK / EXIT CONFIRMATION DIALOG MODAL */}
    <AnimatePresence>
      {showConfirmModal !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmModal('none')}
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative w-full max-w-sm bento-card bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl rounded-3xl select-none text-center flex flex-col items-center gap-5 z-10"
          >
            <div className="p-3.5 rounded-full bg-amber-50 dark:bg-amber-900/10 text-amber-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                {showConfirmModal === 'exit-app' ? 'Confirm Exit Game' : 'Confirm Return to Home'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                {showConfirmModal === 'exit-app'
                  ? 'Are you sure you want to exit the puzzle session and terminate the application?'
                  : 'Are you sure you want to go back to the home page? Your active puzzle progress will be lost.'}
              </p>
            </div>
            
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setShowConfirmModal('none')}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-350 cursor-pointer active:scale-95 transition-all"
              >
                {showConfirmModal === 'exit-app' ? 'No, Stay' : 'No, Keep Solving'}
              </button>
              
              <button
                onClick={() => {
                  const mode = showConfirmModal;
                  setShowConfirmModal('none');
                  sfx.playLockClick(isMuted);
                  if (mode === 'exit-app') {
                    setIsExited(true);
                    try {
                      window.close();
                    } catch (e) {}
                  } else {
                    setGameState('menu');
                    setHintFlashRect(null);
                    setIsWinningCascade(false);
                    setShowWinModal(false);
                  }
                }}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-650 text-white cursor-pointer active:scale-95 transition-all shadow-md shadow-red-500/10"
              >
                {showConfirmModal === 'exit-app' ? 'Yes, Exit' : 'Yes, Go Back'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
