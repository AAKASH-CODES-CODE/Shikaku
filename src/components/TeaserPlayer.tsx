import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, X, Sparkles, Check, ChevronRight, Video, Smartphone, Camera, HelpCircle, Volume2, VolumeX } from 'lucide-react';

/**
 * High-quality Cinematic Sound Synthesizer using Web Audio API
 */
const playTeaserSFX = {
  getAudioCtx(): AudioContext | null {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      return ctx;
    } catch {
      return null;
    }
  },

  // Redesigned Epic Cinematic Intro Sound: High-end theatrical laser rise + thunder impact + retro crystal ring
  playEpicIntroImpact(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Heavy futuristic sub-bass drop & rumble
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subFilter = ctx.createBiquadFilter();

    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(90, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 1.8);

    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(80, t);

    subGain.gain.setValueAtTime(0.55, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 1.85);

    // 2. High frequency laser-like pitch rise (whoosh)
    const riseOsc = ctx.createOscillator();
    const riseGain = ctx.createGain();
    riseOsc.type = 'triangle';
    riseOsc.frequency.setValueAtTime(60, t);
    riseOsc.frequency.exponentialRampToValueAtTime(1500, t + 0.7);

    riseGain.gain.setValueAtTime(0, t);
    riseGain.gain.linearRampToValueAtTime(0.25, t + 0.55);
    riseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    riseOsc.connect(riseGain);
    riseGain.connect(ctx.destination);
    riseOsc.start(t);
    riseOsc.stop(t + 0.75);

    // 3. Cyber crystal chime ring (at t + 0.65, matching high climax of pitch rise)
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6 majestic major chord chord
    notes.forEach((freq, idx) => {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      const delay = t + 0.6 + idx * 0.04;

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(freq, delay);
      chimeOsc.frequency.linearRampToValueAtTime(freq * 0.98, delay + 1.2);

      chimeGain.gain.setValueAtTime(0.001, t);
      chimeGain.gain.setValueAtTime(0.12, delay);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, delay + 1.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(delay);
      chimeOsc.stop(delay + 1.25);
    });
  },

  // Snappy digital mouse hover / haptic tick
  playButtonHover(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, ctx.currentTime);
    osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.005);

    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  },

  // Snap UI click
  playButtonClick(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.091);
  },

  // Dot selection bubble sound
  playDotSelect(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  },

  // Playback State change (Play or Pause) musical sound
  playPlayStateChange(isMuted: boolean, isResumed: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    if (isResumed) {
      // Harmonic Ascent (Play)
      osc1.frequency.setValueAtTime(523.25, t); // C5
      osc2.frequency.setValueAtTime(659.25, t + 0.07); // E5
    } else {
      // Harmonic Descent (Pause)
      osc1.frequency.setValueAtTime(659.25, t); // E5
      osc2.frequency.setValueAtTime(523.25, t + 0.07); // C5
    }

    gain1.gain.setValueAtTime(0.06, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    gain2.gain.setValueAtTime(0.06, t + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(t);
    osc1.stop(t + 0.19);
    osc2.start(t + 0.07);
    osc2.stop(t + 0.26);
  },

  // Plucky organic clock/placement tick
  playTick(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.015);

    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  },

  // Success arpeggio sequence
  playSuccess(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    // Beautiful major-9th arpeggiation (E minor 9 feel)
    const freqs = [329.63, 392.00, 493.88, 587.33, 739.99]; // E4, G4, B4, D5, F#5
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  },

  // Deep retro-alarm red warning thud
  playWrong(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(65, ctx.currentTime + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  },

  // Sweeping space-scanner radar sound
  playRadarPulse(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.6);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(390, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.65);
  },

  // Sweeping background transit whoosh between slides/scenes
  playSceneTransitionWhoosh(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(460, ctx.currentTime + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(290, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  },

  // Play a sequence of bubbling pops for cards appearing
  playCardPopSweep(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const notes = [440.00, 554.37, 659.25, 880.00]; // A4, C#5, E5, A5 arpeggiated blister
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, start + 0.08);

      gain.gain.setValueAtTime(0.07, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.15);
    });
  },

  // Uplifting epic electronic arpeggiated resolution theme for the outro screen
  playOutroTheme(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Major 7 structures with a retro sci-fi vibe
    const chordSequences = [
      [349.23, 440.00, 523.25, 659.25], // F major 7
      [392.00, 493.88, 587.33, 739.99], // G major 6 (sweeps brighter)
      [440.00, 523.25, 659.25, 783.99, 987.77] // A minor 7/9 resolution!
    ];

    chordSequences.forEach((chordNotes, chordIdx) => {
      const startTime = t + chordIdx * 0.65;
      chordNotes.forEach((freq, noteIdx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + noteIdx * 0.04);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.setValueAtTime(0.045, startTime + noteIdx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.85);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime + noteIdx * 0.04);
        osc.stop(startTime + 0.9);
      });
    });

    // Epic background warm synth glow pad
    const padOsc = ctx.createOscillator();
    const padGain = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    padOsc.type = 'sawtooth';
    padOsc.frequency.setValueAtTime(110, t); // A2 fundamental
    padOsc.frequency.linearRampToValueAtTime(220, t + 1.8); // elegant swell to A3
    
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(240, t);
    
    padGain.gain.setValueAtTime(0.14, t);
    padGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
    
    padOsc.connect(lowpass);
    lowpass.connect(padGain);
    padGain.connect(ctx.destination);
    
    padOsc.start(t);
    padOsc.stop(t + 2.2);
  },

  // Glorious sparkling celebrate cascade
  playCelebratingCascade(isMuted: boolean) {
    if (isMuted) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;

    const notes = [261.63, 311.13, 392.00, 466.16, 523.25, 622.25, 783.99, 932.33, 1046.50, 1244.51, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.05;

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.06, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.35);
    });
  }
};

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
  const [isTeaserMuted, setIsTeaserMuted] = useState<boolean>(false);

  const soundTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Sound sequence scheduler
  const clearSoundTimeouts = () => {
    soundTimeoutsRef.current.forEach((t) => clearTimeout(t));
    soundTimeoutsRef.current = [];
  };

  const playSoundLater = (soundType: 'impact' | 'tick' | 'success' | 'wrong' | 'pulse' | 'win' | 'outroTheme' | 'levelPop', delayMs: number) => {
    const t = setTimeout(() => {
      switch (soundType) {
        case 'impact':
          playTeaserSFX.playEpicIntroImpact(isTeaserMuted);
          break;
        case 'tick':
          playTeaserSFX.playTick(isTeaserMuted);
          break;
        case 'success':
          playTeaserSFX.playSuccess(isTeaserMuted);
          break;
        case 'wrong':
          playTeaserSFX.playWrong(isTeaserMuted);
          break;
        case 'pulse':
          playTeaserSFX.playRadarPulse(isTeaserMuted);
          break;
        case 'win':
          playTeaserSFX.playCelebratingCascade(isTeaserMuted);
          break;
        case 'outroTheme':
          playTeaserSFX.playOutroTheme(isTeaserMuted);
          break;
        case 'levelPop':
          playTeaserSFX.playCardPopSweep(isTeaserMuted);
          break;
      }
    }, delayMs);
    soundTimeoutsRef.current.push(t);
  };

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
      clearSoundTimeouts();
      return;
    }

    const startSceneTimer = () => {
      const activeScene = scenes[currentScene];
      
      // Update simulated grid states and clear old sounds
      clearSoundTimeouts();
      handleSceneAnimations(currentScene);

      // Play sweeping transit whoosh when scenes change
      if (currentScene > 0) {
        playTeaserSFX.playSceneTransitionWhoosh(isTeaserMuted);
      }

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
      clearSoundTimeouts();
    };
  }, [currentScene, isPlaying, isTeaserMuted]);

  // Choreographing the virtual grid actions and synchronized soundtrack
  const handleSceneAnimations = (sceneIndex: number) => {
    switch (sceneIndex) {
      case 0: // Intro
        setSimulatedRects([]);
        setShowHintPulse(false);
        setShowWinParticles(false);
        playSoundLater('impact', 0);
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
        playSoundLater('tick', 1200);
        playSoundLater('success', 1300);

        // Step 2: Simulated drawing of a 3x1 box over clue "3"
        setTimeout(() => {
          setSimulatedRects([
            { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true },
            { startX: 2, startY: 0, endX: 4, endY: 0, clue: 3, isValid: true }
          ]);
        }, 2800);
        playSoundLater('tick', 2800);
        playSoundLater('success', 2900);
        break;

      case 2: // Error indicator & resolve
        setSimulatedRects([
          { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true },
          { startX: 2, startY: 0, endX: 4, endY: 0, clue: 3, isValid: true }
        ]);
        
        // Simulate drawing a wrong box (3x1 over a "2" clue - size 3 is wrong)
        setTimeout(() => {
          setSimulatedRects((prev) => [
            ...prev,
            { startX: 0, startY: 2, endX: 2, endY: 2, clue: 2, isValid: false, isWrong: true, label: "Wrong Area" }
          ]);
        }, 1100);
        playSoundLater('tick', 1100);
        playSoundLater('wrong', 1200);

        // Delete incorrect box, substitute for correct box (2x1)
        setTimeout(() => {
          setSimulatedRects((prev) => prev.filter(r => !r.isWrong));
        }, 2850);
        playSoundLater('tick', 2850);

        setTimeout(() => {
          setSimulatedRects((prev) => [
            ...prev,
            { startX: 0, startY: 2, endX: 1, endY: 2, clue: 2, isValid: true }
          ]);
        }, 3400);
        playSoundLater('success', 3450);
        break;

      case 3: // Glowing hints for Box C (clue 6 at Row 1, Col 4)
        setSimulatedRects([
          { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true },
          { startX: 2, startY: 0, endX: 4, endY: 0, clue: 3, isValid: true },
          { startX: 0, startY: 2, endX: 1, endY: 2, clue: 2, isValid: true }
        ]);
        
        // Trigger high impact custom pulsing border hint pointing to the space of Box C
        setTimeout(() => {
          setShowHintPulse(true);
        }, 800);
        playSoundLater('pulse', 800);
        break;

      case 4: // Campaign showcase
        setShowHintPulse(false);
        // Fill up multiple correct spaces quickly, leaving only one final blocker
        setSimulatedRects([
          { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true },
          { startX: 2, startY: 0, endX: 4, endY: 0, clue: 3, isValid: true },
          { startX: 0, startY: 2, endX: 1, endY: 2, clue: 2, isValid: true },
          { startX: 2, startY: 1, endX: 4, endY: 2, clue: 6, isValid: true },
          { startX: 0, startY: 3, endX: 1, endY: 4, clue: 4, isValid: true }
        ]);
        playSoundLater('tick', 100);
        playSoundLater('tick', 220);
        playSoundLater('tick', 340);
        playSoundLater('levelPop', 600); // Elegant futuristic card display bubble pop sequence
        break;

      case 5: // Win explosion!
        setShowHintPulse(false);
        // Place the absolute final block (Box E: clue 6) to solve grid perfectly
        setSimulatedRects([
          { startX: 0, startY: 0, endX: 1, endY: 1, clue: 4, isValid: true },
          { startX: 2, startY: 0, endX: 4, endY: 0, clue: 3, isValid: true },
          { startX: 0, startY: 2, endX: 1, endY: 2, clue: 2, isValid: true },
          { startX: 2, startY: 1, endX: 4, endY: 2, clue: 6, isValid: true },
          { startX: 0, startY: 3, endX: 1, endY: 4, clue: 4, isValid: true },
          { startX: 2, startY: 3, endX: 4, endY: 4, clue: 6, isValid: true } // completion box
        ]);
        playSoundLater('success', 0);
        setTimeout(() => {
          setShowWinParticles(true);
        }, 1000);
        playSoundLater('win', 1000);
        break;

      case 6: // Outro
        playSoundLater('outroTheme', 0); // Majestic ambient progressive electronic chord layout
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
    "0,0": 4, "0,2": 3, "1,4": 6, "2,0": 2, "3,2": 6, "4,0": 4
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
          onMouseEnter={() => playTeaserSFX.playButtonHover(isTeaserMuted)}
          onClick={() => {
            playTeaserSFX.playButtonClick(isTeaserMuted);
            onClose();
          }}
          className="p-2 rounded-full border border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Theater Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-8 relative">
          
          {/* Cinematic Viewport 9:16 (Portrait for Instagram/TikTok status stories) */}
          <div className="relative aspect-[9/16] w-full max-w-[340px] sm:max-w-[360px] rounded-[48px] overflow-hidden border-[12px] border-neutral-900 bg-neutral-950 shadow-[0_24px_80px_rgba(0,0,0,0.95)] flex flex-col ring-1 ring-neutral-800">
            
            {/* Simulated Smartphone Dynamic Notch / Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-24 bg-neutral-900 rounded-full z-50 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-neutral-950 ml-auto mr-3 border border-neutral-800" />
            </div>

            {/* Space buffer for Smartphone Island */}
            <div className="h-10 shrink-0 pointer-events-none" />
            
            {/* Scene Content Frame */}
            <div className="flex-1 flex flex-col items-center justify-between p-6 pb-8 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScene}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="w-full h-full flex flex-col justify-between items-center relative z-20"
                >
                  {/* Top Quote of the current Scene */}
                  <div className="text-center space-y-2.5 px-3 w-full">
                    <motion.h2 
                      id="scene-narrative-title"
                      className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans leading-tight pt-1"
                    >
                      {scenes[currentScene].narrative}
                    </motion.h2>
                    <p className="text-[11px] text-neutral-400 font-semibold leading-relaxed">
                      {scenes[currentScene].subtext}
                    </p>
                  </div>

                  {/* Interactive Virtual Board / Feature Demonstrator */}
                  <div className="flex-1 w-full flex items-center justify-center relative my-3">
                    
                    {/* Scene 0: Epic Title Intro */}
                    {currentScene === 0 && (
                      <div className="flex flex-col items-center justify-center space-y-3 text-center">
                        <motion.h1 
                          initial={{ scale: 0.85, filter: "blur(10px)" }}
                          animate={{ scale: 1, filter: "blur(0px)" }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="text-4xl font-extrabold tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-neutral-500 font-sans"
                        >
                          SHIKAKU
                        </motion.h1>
                        <p className="text-[9px] font-mono tracking-[0.3em] text-blue-500 uppercase font-black">
                          LOGIC REVOLUTION
                        </p>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0.5, 1] }}
                          transition={{ delay: 1, duration: 1.5 }}
                          className="h-[1px] w-20 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                        />
                      </div>
                    )}

                    {/* Scene 1, 2, 3, 5: Simulated Board */}
                    {(currentScene === 1 || currentScene === 2 || currentScene === 3 || currentScene === 5) && (
                      <div className="relative p-2 bg-neutral-900/60 rounded-xl border border-neutral-800 w-[190px] h-[190px] shadow-sm select-none">
                        
                        {/* 5x5 Grid background lines */}
                        <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-[1px] bg-neutral-800 rounded-sm overflow-hidden relative">
                          {virtualCells.map((cell, index) => (
                            <div 
                              key={index} 
                              className="bg-neutral-950/90 flex items-center justify-center relative"
                            >
                              {cell.clue && (
                                <span className="text-sm font-extrabold text-white/90 font-sans">
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
                                  <span className="text-[7px] font-mono uppercase bg-red-600 text-white px-1 py-0.2 rounded font-extrabold">
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
                                gridColumn: "3 / 6", // Spans Col 2 to Col 4 (grid lines 3 to 6)
                                gridRow: "2 / 4"    // Spans Row 1 to Row 2 (grid lines 2 to 4)
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
                              <div className="text-xl font-bold text-white bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-xl">✨ SOLVED! ✨</div>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scene 4: Level slide reels, stacked vertically for narrow layout */}
                    {currentScene === 4 && (
                      <div className="flex flex-col gap-2.5 w-full px-2">
                        {[
                          { title: "Campaign", text: "80 levels of progressive scale", badge: "Campaign Mode", color: "from-[#007AFF]/25 to-[#007AFF]/5", border: "border-blue-500/30" },
                          { title: "Grid Arena", text: "Expert 15x15 logic grids", badge: "Arena Fight", color: "from-emerald-500/25 to-emerald-500/5", border: "border-emerald-500/30" },
                          { title: "Daily", text: "Fresh new boards daily", badge: "Competitions", color: "from-amber-500/25 to-amber-500/5", border: "border-amber-500/30" },
                        ].map((card, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.12, type: "spring", stiffness: 100 }}
                            className={`p-3 rounded-2xl border ${card.border} bg-gradient-to-b ${card.color} text-center space-y-1`}
                          >
                            <span className="text-[7px] font-mono tracking-wider font-extrabold text-white bg-white/10 px-1.5 py-0.5 rounded-full uppercase">
                              {card.badge}
                            </span>
                            <h4 className="text-xs font-black text-white">{card.title}</h4>
                            <p className="text-[9px] text-neutral-400 font-medium">{card.text}</p>
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
                        className="p-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-md w-full max-w-[260px] text-center space-y-4 shadow-xl"
                      >
                        <div className="flex justify-center">
                          <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-400">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-md font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#007AFF] to-[#34C759] uppercase tracking-wider">
                            SHIKAKU PUZZLE
                          </h4>
                          <p className="text-[10px] text-neutral-400 leading-normal font-medium">
                            Minimalist design. High fidelity logic. 100% cloud connected.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 justify-center">
                          <button
                            onMouseEnter={() => playTeaserSFX.playButtonHover(isTeaserMuted)}
                            onClick={() => {
                              playTeaserSFX.playButtonClick(isTeaserMuted);
                              onPlayGame();
                            }}
                            className="w-full px-4 py-2 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
                          >
                            <span>Play Game Now</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onMouseEnter={() => playTeaserSFX.playButtonHover(isTeaserMuted)}
                            onClick={() => {
                              playTeaserSFX.playButtonClick(isTeaserMuted);
                              handleRestart();
                            }}
                            className="w-full px-4 py-2 border border-neutral-800 hover:border-neutral-600 text-neutral-300 rounded-xl text-[10px] font-semibold cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Replay Teaser</span>
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
                        onMouseEnter={() => playTeaserSFX.playButtonHover(isTeaserMuted)}
                        onClick={() => {
                          playTeaserSFX.playDotSelect(isTeaserMuted);
                          jumpToScene(scIdx);
                        }}
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
                onMouseEnter={() => playTeaserSFX.playButtonHover(isTeaserMuted)}
                onClick={() => {
                  playTeaserSFX.playPlayStateChange(isTeaserMuted, !isPlaying);
                  setIsPlaying(!isPlaying);
                }}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white active:scale-90 transition-all cursor-pointer"
                title={isPlaying ? "Pause Scene Timer" : "Resume Auto-Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current text-white/90" /> : <Play className="w-4 h-4 fill-current text-white/90" />}
              </button>
              
              <button
                onMouseEnter={() => playTeaserSFX.playButtonHover(isTeaserMuted)}
                onClick={() => {
                  playTeaserSFX.playButtonClick(isTeaserMuted);
                  handleRestart();
                }}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white active:scale-90 transition-all cursor-pointer"
                title="Restart Teaser Track"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onMouseEnter={() => playTeaserSFX.playButtonHover(isTeaserMuted)}
                onClick={() => {
                  playTeaserSFX.playButtonClick(false);
                  setIsTeaserMuted(!isTeaserMuted);
                }}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white active:scale-90 transition-all cursor-pointer flex items-center"
                title={isTeaserMuted ? "Unmute Teaser Sound" : "Mute Teaser Sound"}
              >
                {isTeaserMuted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
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
                onMouseEnter={() => playTeaserSFX.playButtonHover(isTeaserMuted)}
                onClick={() => {
                  playTeaserSFX.playButtonClick(isTeaserMuted);
                  setShowRecordingGuide(false);
                }}
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
