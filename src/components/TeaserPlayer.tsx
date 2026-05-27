import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, X, Sparkles, Check, ChevronRight, Video, Smartphone, Camera, HelpCircle } from 'lucide-react';

interface TeaserPlayerProps {
  onClose: () => void;
  onPlayGame: () => void;
  reducedMotion?: boolean;
}

interface Scene {
  id: number;
  narrative: string;
  subtext: string;
  duration: number; // in milliseconds
}

export default function TeaserPlayer({ onClose, onPlayGame, reducedMotion = false }: TeaserPlayerProps) {
  const [currentScene, setCurrentScene] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [showRecordingGuide, setShowRecordingGuide] = useState<boolean>(true);

  // Simulated grid state for Scene animations
  const [simulatedRects, setSimulatedRects] = useState<Array<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    clue: number | null;
    isValid: boolean;
    isWrong?: boolean;
    label?: string;
  }>>([]);
  const [showHintPulse, setShowHintPulse] = useState<boolean>(false);
  const [showWinParticles, setShowWinParticles] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scenes: Scene[] = [
    {
      id: 0,
      narrative: "S H I K A K U",
      subtext: "Divide into perfect logical boundaries",
      duration: 3800,
    },
    {
      id: 1,
      narrative: "The Absolute Rule",
      subtext: "Draw rectangles matching each number's exact area",
      duration: 4800,
    },
    {
      id: 2,
      narrative: "Instant Real-Time Logic",
      subtext: "Incorrect partitions turn red. Perfect fits illuminate blue.",
      duration: 4800,
    },
    {
      id: 3,
      narrative: "Intelligent Guidance",
      subtext: "Stuck? Get beautiful, pulsing smart hints pointing to target bounds.",
      duration: 3800,
    },
    {
      id: 4,
      narrative: "Level Campaigns & Daily Arenas",
      subtext: "Scale from 5x5 grids up to expert 15x15 challenges",
      duration: 4200,
    },
    {
      id: 5,
      narrative: "Divide. Match. Conquer.",
      subtext: "Solve completely to trigger satisfying celebratory cascades!",
      duration: 4800,
    },
    {
      id: 6,
      narrative: "Ready to Master the Grid?",
      subtext: "SHIKAKU is available to play right now.",
      duration: 7000,
    },
  ];

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  // Playback timeline controller
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const startSceneTimer = () => {
      const activeScene = scenes[currentScene];
      
      // Update simulated grid states based on the scene index
      handleSceneAnimations(currentScene);

      timerRef.current = setTimeout(() => {
        if (currentScene < scenes.length - 1) {
          setCurrentScene((prev) => prev + 1);
        } else {
          // Wrap around or stop
          setIsPlaying(false);
          setCurrentScene(scenes.length - 1);
        }
      }, activeScene.duration);
    };

    startSceneTimer();

    // Progress bar tracking
    const startTimeStamp = Date.now();
    const elapsedBeforeScene = scenes.slice(0, currentScene).reduce((acc, s) => acc + s.duration, 0);

    progressIntervalRef.current = setInterval(() => {
      const sceneElapsed = Date.now() - startTimeStamp;
      const totalElapsed = Math.min(totalDuration, elapsedBeforeScene + sceneElapsed);
      setProgress((totalElapsed / totalDuration) * 100);
    }, 50);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentScene, isPlaying]);

  // Choreographing the virtual grid actions
  const handleSceneAnimations = (sceneIndex: number) => {
    switch (sceneIndex) {
      case 0: // Intro
        setSimulatedRects([]);
        setShowHintPulse(false);
        setShowWinParticles(false);
        break;

      case 1: // Draw perfect rectangle
        setSimulatedRects([]);
        setShowHintPulse(false);
        setShowWinParticles(false);
        // Step 1: Simulated drawing of a 2x2 box over clue "4" at (0, 0)
        setTimeout(() => {
          setSimulatedRects([
            { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true }
          ]);
        }, 1200);
        // Step 2: Simulated drawing of a 3x1 box over clue "3"
        setTimeout(() => {
          setSimulatedRects([
            { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true },
            { startX: 2, startY: 0, endX: 4, endY: 0, clue: 3, isValid: true }
          ]);
        }, 2800);
        break;

      case 2: // Error indicator & resolve
        setSimulatedRects([
          { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true },
          { startX: 2, startY: 0, endX: 4, endY: 0, clue: 3, isValid: true }
        ]);
        // Simulate drawing a wrong box (3x2 over a "5" clue - size 6 is wrong)
        setTimeout(() => {
          setSimulatedRects((prev) => [
            ...prev,
            { startX: 0, startY: 2, endX: 2, endY: 3, clue: 5, isValid: false, isWrong: true, label: "Wrong Area" }
          ]);
        }, 1100);
        // Delete incorrect box, substitute for correct box (5x1)
        setTimeout(() => {
          setSimulatedRects((prev) => prev.filter(r => !r.isWrong));
        }, 2800);
        setTimeout(() => {
          setSimulatedRects((prev) => [
            ...prev,
            { startX: 0, startY: 2, endX: 4, endY: 2, clue: 5, isValid: true }
          ]);
        }, 3400);
        break;

      case 3: // Glowing hints
        setSimulatedRects([
          { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true },
          { startX: 2, startY: 0, endX: 4, endY: 0, clue: 3, isValid: true },
          { startX: 0, startY: 2, endX: 4, endY: 2, clue: 5, isValid: true }
        ]);
        // Trigger high impact custom pulsing border hint
        setTimeout(() => {
          setShowHintPulse(true);
        }, 800);
        break;

      case 4: // Campaign showcase
        setShowHintPulse(false);
        // Fill up multiple correct spaces quickly
        setSimulatedRects([
          { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true },
          { startX: 2, startY: 0, endX: 4, endY: 0, clue: 3, isValid: true },
          { startX: 0, startY: 2, endX: 4, endY: 2, clue: 5, isValid: true },
          { startX: 0, startY: 3, endX: 3, endY: 3, clue: 4, isValid: true },
          { startX: 4, startY: 1, endX: 4, endY: 4, clue: 4, isValid: true }
        ]);
        break;

      case 5: // Win explosion!
        setShowHintPulse(false);
        // Place the absolute final block to solve grid
        setSimulatedRects([
          { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true },
          { startX: 2, startY: 0, endX: 4, endY: 0, clue: 3, isValid: true },
          { startX: 0, startY: 2, endX: 4, endY: 2, clue: 5, isValid: true },
          { startX: 0, startY: 3, endX: 3, endY: 3, clue: 4, isValid: true },
          { startX: 4, startY: 1, endX: 4, endY: 4, clue: 4, isValid: true },
          { startX: 0, startY: 4, endX: 3, endY: 4, clue: null, isValid: true } // completion box
        ]);
        setTimeout(() => {
          setShowWinParticles(true);
        }, 1000);
        break;

      case 6: // Outro
        // Let user replay or launch directly
        break;

      default:
        break;
    }
  };

  const jumpToScene = (idx: number) => {
    setCurrentScene(idx);
    setIsPlaying(true);
    const prevElapsed = scenes.slice(0, idx).reduce((acc, s) => acc + s.duration, 0);
    setProgress((prevElapsed / totalDuration) * 100);
  };

  const handleRestart = () => {
    setCurrentScene(0);
    setIsPlaying(true);
    setProgress(0);
  };

  // Static 5x5 grid cells array for virtual dashboard demonstration
  const virtualCells = [];
  const cellClues: { [key: string]: number } = {
    "0,0": 4, "0,2": 3, "2,0": 5, "3,0": 4, "1,4": 4
  };
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      virtualCells.push({
        x: c,
        y: r,
        clue: cellClues[`${r},${c}`] || null
      });
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between overflow-y-auto select-none backdrop-blur-md">
      
      {/* Cinematic Top Ambient Light Bar */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {/* Header Controls */}
      <header className="p-4 sm:p-6 w-full max-w-7xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#007AFF]"></span>
          </div>
          <span className="text-xs font-mono font-extrabold uppercase tracking-[0.2em] text-neutral-400">
            SHIKAKU Cinematic Promo Play
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full border border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Theater Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-8 relative">
          
          {/* Cinematic Viewport 16:9 */}
          <div className="w-full aspect-video rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950/90 shadow-[0_24px_60px_rgba(0,0,0,0.8)] flex flex-col relative">
            
            {/* Cinematic top letterbox bar */}
            <div className="absolute top-0 inset-x-0 h-[8%] bg-black/90 pointer-events-none z-40 border-b border-neutral-900" />
            
            {/* Scene Content Frame */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScene}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="w-full h-full flex flex-col justify-between items-center relative z-20"
                >
                  {/* Top Quote of the current Scene */}
                  <div className="text-center space-y-2 max-w-xl">
                    <motion.h2 
                      id="scene-narrative-title"
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans"
                    >
                      {scenes[currentScene].narrative}
                    </motion.h2>
                    <p className="text-xs sm:text-sm text-neutral-400 font-medium">
                      {scenes[currentScene].subtext}
                    </p>
                  </div>

                  {/* Interactive Virtual Board / Feature Demonstrator */}
                  <div className="flex-1 w-full max-h-[300px] flex items-center justify-center relative my-4">
                    
                    {/* Scene 0: Epic Title Intro */}
                    {currentScene === 0 && (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <motion.h1 
                          initial={{ scale: 0.85, filter: "blur(10px)" }}
                          animate={{ scale: 1, filter: "blur(0px)" }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="text-5xl sm:text-7xl font-extrabold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-500 font-sans"
                        >
                          SHIKAKU
                        </motion.h1>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0.5, 1] }}
                          transition={{ delay: 1, duration: 1.5 }}
                          className="h-[1px] w-36 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                        />
                      </div>
                    )}

                    {/* Scene 1, 2, 3, 5: Simulated Board */}
                    {(currentScene === 1 || currentScene === 2 || currentScene === 3 || currentScene === 5) && (
                      <div className="relative p-2.5 bg-neutral-900/60 rounded-xl border border-neutral-800 w-[210px] h-[210px] sm:w-[240px] sm:h-[240px] shadow-sm select-none">
                        
                        {/* 5x5 Grid background lines */}
                        <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-[1px] bg-neutral-800 rounded-sm overflow-hidden relative">
                          {virtualCells.map((cell, index) => (
                            <div 
                              key={index} 
                              className="bg-neutral-950/90 flex items-center justify-center relative"
                            >
                              {cell.clue && (
                                <span className="text-sm sm:text-base font-extrabold text-white/90 font-sans">
                                  {cell.clue}
                                </span>
                              )}
                            </div>
                          ))}

                          {/* Render Simulated Board Rectangles */}
                          {simulatedRects.map((rect, idx) => {
                            const gridColumn = `${rect.startX + 1} / ${rect.endX + 2}`;
                            const gridRow = `${rect.startY + 1} / ${rect.endY + 2}`;

                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`absolute inset-0.5 rounded-md flex flex-col justify-center items-center z-10 border pointer-events-none ${
                                  rect.isWrong 
                                    ? 'bg-[#FF3B30]/15 border-[#FF3B30] text-[#FF3B30]' 
                                    : 'bg-[#007AFF]/15 border-[#007AFF] text-[#007AFF]'
                                }`}
                                style={{ gridColumn, gridRow }}
                              >
                                {rect.label && (
                                  <span className="text-[8px] font-mono uppercase bg-red-600 text-white px-1 py-0.2 rounded font-extrabold">
                                    {rect.label}
                                  </span>
                                )}
                              </motion.div>
                            );
                          })}

                          {/* Dynamic smart hint border effect */}
                          {showHintPulse && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ 
                                opacity: 1, 
                                borderWidth: ["3px", "8px", "3px", "8px", "3px"],
                                borderColor: ["#f59e0b", "#d97706", "#f59e0b", "#d97706", "#f59e0b"]
                              }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                              className="absolute inset-[1px] rounded-lg border-solid z-30 pointer-events-none bg-amber-500/10"
                              style={{
                                gridColumn: "3 / 6", // 3-cell wide space at top
                                gridRow: "1 / 2"
                              }}
                            />
                          )}
                        </div>

                        {/* Particle win burst layer */}
                        {showWinParticles && (
                          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                            <motion.div 
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: [1, 1.4, 0], opacity: [1, 1, 0] }}
                              transition={{ duration: 1.4 }}
                              className="w-full h-full flex items-center justify-center"
                            >
                              <div className="text-3xl">✨ SOLVED! ✨</div>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scene 4: Level slide reels */}
                    {currentScene === 4 && (
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-lg px-6">
                        {[
                          { title: "Campaign", text: "80 levels of progressive scale", badge: "Campaign Mode", color: "from-[#007AFF]/20 to-[#007AFF]/5", border: "border-blue-500/30" },
                          { title: "Grid Arena", text: "Expert 15x15 logic grids", badge: "Multiplayer Ready", color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30" },
                          { title: "Daily", text: "Fresh new puzzle boards daily", badge: "Leaderboards", color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/30" },
                        ].map((card, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.18, type: "spring", stiffness: 100 }}
                            className={`flex-1 p-4 rounded-xl border ${card.border} bg-gradient-to-b ${card.color} text-center space-y-2`}
                          >
                            <span className="text-[8px] font-mono tracking-widest font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-full uppercase">
                              {card.badge}
                            </span>
                            <h4 className="text-sm font-extrabold text-white">{card.title}</h4>
                            <p className="text-[10px] text-neutral-400 font-medium">{card.text}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Scene 6: Outro Block */}
                    {currentScene === 6 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md max-w-sm text-center space-y-4"
                      >
                        <div className="flex justify-center">
                          <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
                            <Sparkles className="w-8 h-8 animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#007AFF] to-[#34C759] uppercase tracking-wider">
                            SHIKAKU PUZZLE
                          </h4>
                          <p className="text-xs text-neutral-400">
                            Minimalist design. High fidelity logic. 100% cloud connected.
                          </p>
                        </div>
                        <div className="flex gap-2.5 justify-center">
                          <button
                            onClick={handleRestart}
                            className="px-4 py-2 border border-neutral-700 hover:border-white text-white rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Replay Teaser</span>
                          </button>
                          <button
                            onClick={onPlayGame}
                            className="px-5 py-2.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                          >
                            <span>Enter Game</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                  </div>

                  {/* Scene Index Progress Indicator Dots */}
                  <div className="flex items-center gap-2 mb-2 z-20">
                    {scenes.map((sc, scIdx) => (
                      <button
                        key={sc.id}
                        onClick={() => jumpToScene(scIdx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          currentScene === scIdx 
                            ? 'bg-blue-500 w-6' 
                            : 'bg-neutral-800 w-1.5 hover:bg-neutral-600'
                        }`}
                        title={`Scene ${scIdx + 1}`}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Cinematic bottom letterbox bar */}
            <div className="absolute bottom-0 inset-x-0 h-[8%] bg-black/90 pointer-events-none z-40 border-t border-neutral-900" />
          </div>

          {/* Video Playback Timeline Controls */}
          <div className="w-full flex items-center justify-between gap-4 py-2 px-3 border border-neutral-950 bg-neutral-900/40 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white active:scale-90 transition-all cursor-pointer"
                title={isPlaying ? "Pause Scene Timer" : "Resume Auto-Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current text-white/90" /> : <Play className="w-4 h-4 fill-current text-white/90" />}
              </button>
              
              <button
                onClick={handleRestart}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white active:scale-90 transition-all cursor-pointer"
                title="Restart Teaser Track"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Total progress timeline visual */}
            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="text-[10px] font-mono text-neutral-400 min-w-14 text-right">
              {Math.min(100, Math.round(progress))}% Done
            </div>
          </div>

        </div>
      </main>

      {/* Recording Help Banner (So user knows how to capture the MP4 trailer) */}
      <AnimatePresence>
        {showRecordingGuide && (
          <footer className="w-full bg-neutral-900 border-t border-neutral-800">
            <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-400 font-sans">
                  <Camera className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span>💡 PRO-TIPS FOR CREATING RECORDINGS</span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-400 font-medium">
                  We designed this teaser in full realtime Vectors! To generate a perfect launch video for your store page, open your browser in a new tab, launch your favorite screen recorder (<strong>OSX Cmd+Shift+5</strong> or <strong>OBS Studio</strong>), and click play. The rendering is perfectly crisp, razor sharp, and runs at native 60fps frame rate.
                </p>
              </div>
              <button
                onClick={() => setShowRecordingGuide(false)}
                className="px-3.5 py-1.5 border border-neutral-800 hover:border-neutral-600 rounded-lg text-[10px] font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                Dismiss Guide
              </button>
            </div>
          </footer>
        )}
      </AnimatePresence>

    </div>
  );
}
