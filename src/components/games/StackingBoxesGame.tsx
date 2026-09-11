import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Layers, 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  Flame, 
  ArrowDown, 
  AlertCircle,
  Volume2
} from 'lucide-react';
import sound from '../../services/soundEngine';

interface PlacedBox {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isPerfect: boolean;
}

interface FallingFragment {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  vy: number;
  vx: number;
  rotation: number;
  vRot: number;
}

const BOX_HEIGHT = 28;
const INITIAL_BOX_WIDTH = 220;
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 560;

const PALETTE = [
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#eab308', // yellow
];

export const StackingBoxesGame: React.FC = () => {
  const [boxes, setBoxes] = useState<PlacedBox[]>([]);
  const [fragments, setFragments] = useState<FallingFragment[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('sound_box_best_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [combo, setCombo] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Moving box state
  const movingX = useRef<number>(50);
  const movingDirection = useRef<number>(1);
  const movingSpeed = useRef<number>(3.5);
  const movingWidth = useRef<number>(INITIAL_BOX_WIDTH);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const cameraOffsetY = useRef<number>(0);

  // Init game
  const resetGame = useCallback(() => {
    sound.playButtonClick();
    const baseBox: PlacedBox = {
      id: 0,
      x: (CANVAS_WIDTH - INITIAL_BOX_WIDTH) / 2,
      y: CANVAS_HEIGHT - 60,
      width: INITIAL_BOX_WIDTH,
      height: BOX_HEIGHT,
      color: PALETTE[0],
      isPerfect: true,
    };
    setBoxes([baseBox]);
    setFragments([]);
    setScore(0);
    setCombo(0);
    setIsGameOver(false);
    setStatusMessage(null);
    movingWidth.current = INITIAL_BOX_WIDTH;
    movingX.current = 50;
    movingDirection.current = 1;
    movingSpeed.current = 3.5;
    cameraOffsetY.current = 0;
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Drop current box
  const dropBox = useCallback(() => {
    if (isGameOver || boxes.length === 0) return;

    const topBox = boxes[boxes.length - 1];
    const curX = movingX.current;
    const curW = movingWidth.current;
    const curY = topBox.y - BOX_HEIGHT;

    const offset = curX - topBox.x;
    const absOffset = Math.abs(offset);

    // Completely missed the platform?
    if (absOffset >= curW) {
      // Box falls down completely
      sound.playBoxFall();
      setIsGameOver(true);
      setStatusMessage('Missed the stack! The box tumbled down.');

      // Add falling whole box
      setFragments((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: curX,
          y: curY,
          width: curW,
          height: BOX_HEIGHT,
          color: PALETTE[boxes.length % PALETTE.length],
          vy: 2,
          vx: offset > 0 ? 3 : -3,
          rotation: 0,
          vRot: (Math.random() - 0.5) * 0.15,
        },
      ]);
      return;
    }

    // Perfect alignment check (offset < 4 pixels or < 4% of width)
    const isPerfect = absOffset <= 4;
    let newX = curX;
    let newW = curW;
    const color = PALETTE[boxes.length % PALETTE.length];

    if (isPerfect) {
      // Snaps to perfect alignment!
      newX = topBox.x;
      const nextCombo = combo + 1;
      setCombo(nextCombo);

      // Play perfect snap + climbing harmonic combo sound!
      sound.playBoxPlacement(1.0, nextCombo);
      setStatusMessage(`✨ PERFECT ALIGNMENT! ${nextCombo}x Combo!`);

      // Gentle celebratory particle burst on 5x streak
      if (nextCombo % 5 === 0) {
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.5 }
        });
      }
    } else {
      // Imperfect placement: cut off the overhang
      setCombo(0);
      newW = curW - absOffset;
      movingWidth.current = newW;

      if (offset > 0) {
        // Dropped to the right
        newX = curX;
        // Overhanging right fragment
        const fragW = absOffset;
        const fragX = curX + newW;
        setFragments((prev) => [
          ...prev,
          {
            id: Date.now(),
            x: fragX,
            y: curY,
            width: fragW,
            height: BOX_HEIGHT,
            color,
            vy: 2,
            vx: 3.5,
            rotation: 0,
            vRot: 0.1,
          },
        ]);
      } else {
        // Dropped to the left
        newX = topBox.x;
        // Overhanging left fragment
        const fragW = absOffset;
        const fragX = curX;
        setFragments((prev) => [
          ...prev,
          {
            id: Date.now(),
            x: fragX,
            y: curY,
            width: fragW,
            height: BOX_HEIGHT,
            color,
            vy: 2,
            vx: -3.5,
            rotation: 0,
            vRot: -0.1,
          },
        ]);
      }

      // Calculate accuracy
      const accuracy = 1 - absOffset / curW;
      sound.playBoxPlacement(accuracy, 0);

      // Check if the stack is getting dangerously narrow / unstable
      if (newW < 60) {
        sound.playStackTension();
        setStatusMessage('⚠️ Warning: Stack is wobbling & unstable!');
      } else {
        setStatusMessage(null);
      }
    }

    const nextBox: PlacedBox = {
      id: Date.now(),
      x: newX,
      y: curY,
      width: newW,
      height: BOX_HEIGHT,
      color,
      isPerfect,
    };

    const nextScore = score + 1;
    setScore(nextScore);
    if (nextScore > bestScore) {
      setBestScore(nextScore);
      localStorage.setItem('sound_box_best_score', String(nextScore));
    }

    // Height Milestones Audio
    if (nextScore === 10 || nextScore === 20) {
      sound.playHeightMilestone(false);
      setStatusMessage(`🏅 Milestone Reached: ${nextScore} Boxes Tall!`);
    } else if (nextScore === 35) {
      sound.playHeightMilestone(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });
      setStatusMessage(`🏆 IMPRESSIVE ALTITUDE: 35 Boxes!`);
    }

    setBoxes((prev) => [...prev, nextBox]);

    // Adjust speed slightly
    movingSpeed.current = Math.min(7.5, 3.5 + nextScore * 0.12);
    movingDirection.current = movingDirection.current * -1;
  }, [boxes, combo, isGameOver, score, bestScore]);

  // Handle keyboard drop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        dropBox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropBox]);

  // Main Animation / Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // 1. Move current swinging box
      if (!isGameOver) {
        movingX.current += movingSpeed.current * movingDirection.current;
        if (movingX.current + movingWidth.current >= CANVAS_WIDTH - 20) {
          movingDirection.current = -1;
        } else if (movingX.current <= 20) {
          movingDirection.current = 1;
        }
      }

      // 2. Adjust camera offset smoothly to follow the top of the stack
      const topPlacedY = boxes.length > 0 ? boxes[boxes.length - 1].y : CANVAS_HEIGHT - 60;
      const targetCamOffset = Math.max(0, (CANVAS_HEIGHT * 0.6) - topPlacedY);
      cameraOffsetY.current += (targetCamOffset - cameraOffsetY.current) * 0.08;

      // 3. Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle background grid
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 1;
      for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.translate(0, cameraOffsetY.current);

      // Ground platform
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, CANVAS_HEIGHT - 32, CANVAS_WIDTH, 40);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, CANVAS_HEIGHT - 32, CANVAS_WIDTH, 4);

      // Draw placed boxes
      boxes.forEach((box, i) => {
        ctx.fillStyle = box.color;
        // Rounded box with subtle top shine
        ctx.beginPath();
        ctx.roundRect(box.x, box.y, box.width, box.height, 4);
        ctx.fill();

        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(box.x, box.y, box.width, 3);

        // Shadow underside
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(box.x, box.y + box.height - 3, box.width, 3);

        // Golden star badge if perfect
        if (box.isPerfect && i > 0) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(box.x + box.width / 2, box.y + box.height / 2, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw moving box if alive
      if (!isGameOver && boxes.length > 0) {
        const topY = boxes[boxes.length - 1].y - BOX_HEIGHT;
        const color = PALETTE[boxes.length % PALETTE.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(movingX.current, topY, movingWidth.current, BOX_HEIGHT, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(movingX.current, topY, movingWidth.current, 3);

        // Guide alignment shadows
        const topBox = boxes[boxes.length - 1];
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(topBox.x, topY);
        ctx.lineTo(topBox.x, topBox.y);
        ctx.moveTo(topBox.x + topBox.width, topY);
        ctx.lineTo(topBox.x + topBox.width, topBox.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw falling fragments
      setFragments((prevFrags) => {
        const nextFrags: FallingFragment[] = [];
        prevFrags.forEach((frag) => {
          frag.y += frag.vy;
          frag.x += frag.vx;
          frag.vy += 0.35; // gravity
          frag.rotation += frag.vRot;

          // Draw fragment
          ctx.save();
          ctx.translate(frag.x + frag.width / 2, frag.y + frag.height / 2);
          ctx.rotate(frag.rotation);
          ctx.fillStyle = frag.color;
          ctx.globalAlpha = Math.max(0, 1 - (frag.y - (CANVAS_HEIGHT - 40)) / 200);
          ctx.fillRect(-frag.width / 2, -frag.height / 2, frag.width, frag.height);
          ctx.restore();

          if (frag.y < CANVAS_HEIGHT + 300) {
            nextFrags.push(frag);
          }
        });
        return nextFrags;
      });

      ctx.restore();

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [boxes, isGameOver]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-violet-500/20 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-violet-400 text-xs sm:text-sm font-semibold tracking-wider uppercase">
            <Layers className="w-4 h-4" />
            <span>Stacking the Boxes • Precision Acoustic Feedback</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Timing & Physics Harmonics
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Align boxes with millimeter precision to build combo chimes. Listen to subtle stack tension when narrow,
            and rewarding milestones as your tower reaches skyward!
          </p>
        </div>

        {/* Live Score Badges */}
        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10 text-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Height
            </span>
            <span className="font-mono text-3xl font-black text-white">{score}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10 text-center">
            <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>Best</span>
            </span>
            <span className="font-mono text-3xl font-black text-amber-300">{bestScore}</span>
          </div>
        </div>
      </div>

      {/* Main Canvas + Control Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Canvas Arena */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div
            id="stack-arena-container"
            onClick={dropBox}
            className="relative bg-slate-950 rounded-3xl p-2 border-2 border-slate-800 shadow-2xl overflow-hidden cursor-pointer select-none max-w-[480px] w-full"
            style={{ touchAction: 'manipulation' }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-auto rounded-2xl block bg-radial from-slate-900 to-slate-950"
            />

            {/* Click/Space prompt overlay */}
            {!isGameOver && (
              <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-mono text-slate-300 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>TAP / CLICK / SPACE TO DROP</span>
              </div>
            )}

            {/* Combo Streak Indicator */}
            {combo > 1 && !isGameOver && (
              <div className="absolute top-4 right-4 pointer-events-none flex items-center gap-1.5 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-lg animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                <span>{combo}x PERFECT COMBO</span>
              </div>
            )}

            {/* Status notification */}
            {statusMessage && !isGameOver && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-900/90 border border-slate-700 text-white px-4 py-1.5 rounded-xl text-xs font-medium shadow-xl">
                {statusMessage}
              </div>
            )}

            {/* Game Over Screen Overlay */}
            {isGameOver && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Stack Collapsed!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  The box tumbled past the edge with full tumbling & impact acoustics.
                </p>

                <div className="mt-4 flex items-center gap-6 text-sm font-mono">
                  <div>
                    <span className="text-slate-500 block text-xs">Final Height</span>
                    <span className="text-2xl font-bold text-white">{score}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Best Record</span>
                    <span className="text-2xl font-bold text-amber-400">{bestScore}</span>
                  </div>
                </div>

                <button
                  id="replay-stack-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetGame();
                  }}
                  onMouseEnter={() => sound.playHover()}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Stack Again</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              id="drop-box-manual-btn"
              onClick={dropBox}
              disabled={isGameOver}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <ArrowDown className="w-4 h-4" />
              <span>Drop Box (Space)</span>
            </button>
            <button
              id="restart-stack-btn"
              onClick={resetGame}
              onMouseEnter={() => sound.playHover()}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Restart Stack"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Audio Engineering Details & Sound Log */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-violet-500" />
              <span>Physics Audio Legend</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
                <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span>Perfect Snap Chime</span>
                  <span className="font-mono text-[10px]">Alignment &gt; 95%</span>
                </div>
                <p className="text-emerald-900/80 dark:text-emerald-200/80 mt-1">
                  Wood snap + climbing pentatonic crystal chime. Consecutives climb in musical pitch!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Solid Wooden Thud</span>
                  <span className="font-mono text-[10px]">Good Placement</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Organic lowpass filtered wood impact. Slices off overhanging slice.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20">
                <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>Stack Wobble Tension</span>
                  <span className="font-mono text-[10px]">Width &lt; 60px</span>
                </div>
                <p className="text-amber-900/80 dark:text-amber-200/80 mt-1">
                  Subtle creaking tension oscillation when the tower gets razor thin.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/20">
                <div className="font-semibold text-rose-800 dark:text-rose-300 flex items-center justify-between">
                  <span>Tumbling Fall & Impact</span>
                  <span className="font-mono text-[10px]">Complete Miss</span>
                </div>
                <p className="text-rose-900/80 dark:text-rose-200/80 mt-1">
                  Descending slide whistle into ground impact sub-thud.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-500/20">
                <div className="font-semibold text-violet-800 dark:text-violet-300 flex items-center justify-between">
                  <span>Height Milestone (10 & 35)</span>
                  <span className="font-mono text-[10px]">Altitude Goal</span>
                </div>
                <p className="text-violet-900/80 dark:text-violet-200/80 mt-1">
                  Short rewarding achievement chord at 10, grand crystal sequence at 35.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
