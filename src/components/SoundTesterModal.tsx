import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Sliders, X, Play, RotateCcw } from 'lucide-react';
import sound from '../services/soundEngine';

interface SoundTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  volume: number;
  onVolumeChange: (val: number) => void;
}

export const SoundTesterModal: React.FC<SoundTesterModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  volume,
  onVolumeChange,
}) => {
  const [rapidClickCount, setRapidClickCount] = useState(0);

  if (!isOpen) return null;

  const handleClose = () => {
    sound.playPanelClose();
    onClose();
  };

  const testRapidGold = () => {
    setRapidClickCount((prev) => prev + 1);
    sound.playGoldClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        id="sound-tester-dialog"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg tracking-tight">Sound Design Laboratory</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive acoustic inspector for custom synthesized audio
              </p>
            </div>
          </div>
          <button
            id="close-sound-tester-btn"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Close sound tester"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Controls inside Modal */}
        <div className="px-6 py-3 bg-amber-500/5 dark:bg-amber-500/10 border-b border-amber-500/10 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <button
              id="tester-toggle-sound-btn"
              onClick={onToggleSound}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all text-sm ${
                soundEnabled
                  ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                  : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>🔊 Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>🔇 Sound Off</span>
                </>
              )}
            </button>
            <span className="text-xs text-slate-500">
              {soundEnabled ? 'Synthesizer Active' : 'Muted (Audio engine suspended)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Volume</span>
            <input
              id="tester-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              disabled={!soundEnabled}
              className="w-24 accent-amber-500 cursor-pointer disabled:opacity-40"
            />
            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 w-9 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Scrollable Auditions list */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* 1. General UI */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>General UI Sounds</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => sound.playButtonClick()}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between"
              >
                <span>Button Click</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playHover()}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between"
              >
                <span>Hover Blip</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playPanelOpen()}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between"
              >
                <span>Panel Open</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playPanelClose()}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between"
              >
                <span>Panel Close</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playSuccess()}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between"
              >
                <span>Success Chime</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playError()}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between"
              >
                <span>Error Thud</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playNavSwitch()}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between"
              >
                <span>Game Switch</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playGameComplete()}
                className="px-3 py-2 text-left rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-200 transition-colors flex items-center justify-between font-medium"
              >
                <span>Game Complete</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </button>
            </div>
          </div>

          {/* 2. Spend Your Money */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Spend Your Money Game</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => sound.playBuy()}
                className="px-3 py-2 text-left rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center justify-between"
              >
                <span>Cash / Coin Buy</span>
                <Play className="w-3 h-3 text-emerald-500" />
              </button>
              <button
                onClick={() => sound.playSell()}
                className="px-3 py-2 text-left rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100 transition-colors flex items-center justify-between"
              >
                <span>Sell Transaction</span>
                <Play className="w-3 h-3 text-blue-500" />
              </button>
              <button
                onClick={() => sound.playCantAfford()}
                className="px-3 py-2 text-left rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 hover:bg-rose-100 transition-colors flex items-center justify-between"
              >
                <span>Unaffordable Alert</span>
                <Play className="w-3 h-3 text-rose-500" />
              </button>
              <button
                onClick={() => sound.playBigSpend()}
                className="px-3 py-2 text-left rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 hover:bg-purple-100 transition-colors flex items-center justify-between"
              >
                <span>Luxury Mega Spend</span>
                <Play className="w-3 h-3 text-purple-500" />
              </button>
              <button
                onClick={() => sound.playZeroBalance()}
                className="col-span-2 px-3 py-2 text-left rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors flex items-center justify-between"
              >
                <span>Exact $0 Reached (Milestone Resolution)</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Earn The Gold */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Earn The Gold (Rapid-Click Friendly)</span>
              <span className="text-[11px] font-normal text-slate-500">
                Micro-pitch randomized + musical progression
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={testRapidGold}
                className="col-span-2 sm:col-span-1 px-3 py-2 text-left rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-200 transition-all active:scale-95 flex items-center justify-between font-medium"
              >
                <span>Click Soft Coin ({rapidClickCount})</span>
                <Play className="w-3 h-3 text-amber-600" />
              </button>
              <button
                onClick={() => sound.playUpgradeBuy()}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors flex items-center justify-between"
              >
                <span>Upgrade Purchase</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playGoldMilestone('major_production')}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors flex items-center justify-between"
              >
                <span>Production Milestone</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playGoldMilestone('gold_milestone')}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors flex items-center justify-between"
              >
                <span>Large Gold Milestone</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playResetWarning()}
                className="px-3 py-2 text-left rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 hover:bg-rose-100 transition-colors flex items-center justify-between"
              >
                <span>Reset Warning Tone</span>
                <RotateCcw className="w-3 h-3 text-rose-500" />
              </button>
            </div>
          </div>

          {/* 4. How Much Everything Moved */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>How Much Everything Moved (Scale Acoustics)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => sound.playScaleTransition('planetary')}
                className="px-3 py-2 text-left rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 hover:bg-sky-100 transition-colors flex items-center justify-between"
              >
                <span>Planetary Sweep</span>
                <Play className="w-3 h-3 text-sky-500" />
              </button>
              <button
                onClick={() => sound.playScaleTransition('stellar')}
                className="px-3 py-2 text-left rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center justify-between"
              >
                <span>Stellar Resonant</span>
                <Play className="w-3 h-3 text-indigo-500" />
              </button>
              <button
                onClick={() => sound.playScaleTransition('galactic')}
                className="px-3 py-2 text-left rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-300 hover:bg-violet-100 transition-colors flex items-center justify-between"
              >
                <span>Galactic Warmth</span>
                <Play className="w-3 h-3 text-violet-500" />
              </button>
              <button
                onClick={() => sound.playScaleTransition('universal')}
                className="px-3 py-2 text-left rounded-lg bg-slate-900 text-slate-100 hover:bg-slate-800 transition-colors flex items-center justify-between border border-slate-700"
              >
                <span>Universal Deep Swell</span>
                <Play className="w-3 h-3 text-cyan-400" />
              </button>
              <button
                onClick={() => sound.playDiscovery()}
                className="col-span-2 px-3 py-2 text-left rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 hover:bg-cyan-100 transition-colors flex items-center justify-between font-medium"
              >
                <span>Discovery Chime (Milestone)</span>
                <Sparkles className="w-3 h-3 text-cyan-500" />
              </button>
            </div>
          </div>

          {/* 5. Stacking the Boxes */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Stacking the Boxes (Dynamic Physics Audio)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => sound.playBoxPlacement(1.0, 3)}
                className="px-3 py-2 text-left rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center justify-between"
              >
                <span>Perfect Snap + Combo</span>
                <Play className="w-3 h-3 text-emerald-500" />
              </button>
              <button
                onClick={() => sound.playBoxPlacement(0.8, 0)}
                className="px-3 py-2 text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors flex items-center justify-between"
              >
                <span>Good Wooden Thud</span>
                <Play className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => sound.playBoxPlacement(0.3, 0)}
                className="px-3 py-2 text-left rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors flex items-center justify-between"
              >
                <span>Scuffed Wood Slide</span>
                <Play className="w-3 h-3 text-amber-500" />
              </button>
              <button
                onClick={() => sound.playStackTension()}
                className="px-3 py-2 text-left rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 hover:bg-orange-100 transition-colors flex items-center justify-between"
              >
                <span>Stack Wobble Tension</span>
                <Play className="w-3 h-3 text-orange-500" />
              </button>
              <button
                onClick={() => sound.playBoxFall()}
                className="px-3 py-2 text-left rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 hover:bg-rose-100 transition-colors flex items-center justify-between"
              >
                <span>Box Falling & Impact</span>
                <Play className="w-3 h-3 text-rose-500" />
              </button>
              <button
                onClick={() => sound.playHeightMilestone(false)}
                className="px-3 py-2 text-left rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 hover:bg-sky-100 transition-colors flex items-center justify-between"
              >
                <span>Height Milestone (10)</span>
                <Play className="w-3 h-3 text-sky-500" />
              </button>
              <button
                onClick={() => sound.playHeightMilestone(true)}
                className="col-span-2 sm:col-span-3 px-3 py-2 text-left rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 hover:bg-amber-500/25 transition-colors flex items-center justify-between font-semibold"
              >
                <span>Grand Altitude Celebration (35+ Boxes)</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <span>Synthesized in real-time with Web Audio API</span>
          <button
            id="close-tester-footer-btn"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
