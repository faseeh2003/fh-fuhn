import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Sparkles, Sliders, DollarSign, Coins, Compass, Layers } from 'lucide-react';
import { ActiveGame } from '../types';
import sound from '../services/soundEngine';

interface SoundHeaderProps {
  activeGame: ActiveGame;
  onSelectGame: (game: ActiveGame) => void;
  onOpenSoundTester: () => void;
}

export const SoundHeader: React.FC<SoundHeaderProps> = ({
  activeGame,
  onSelectGame,
  onOpenSoundTester,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.getEnabled());
  const [volume, setVolume] = useState(sound.getVolume());
  const [isAudioActive, setIsAudioActive] = useState(false);

  useEffect(() => {
    const unsubSettings = sound.onSettingsChange(() => {
      setSoundEnabled(sound.getEnabled());
      setVolume(sound.getVolume());
    });
    const unsubActivity = sound.subscribeActivity((active) => {
      setIsAudioActive(active);
    });
    return () => {
      unsubSettings();
      unsubActivity();
    };
  }, []);

  const handleToggleSound = () => {
    const newState = sound.toggleSound();
    setSoundEnabled(newState);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    sound.setVolume(val);
  };

  const handleTabClick = (game: ActiveGame) => {
    if (game !== activeGame) {
      sound.playNavSwitch();
      onSelectGame(game);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Sound status wave */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                    SoundStudio
                  </h1>
                  {/* Subtle Audio Activity Wave */}
                  <div
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400"
                    title={soundEnabled ? (isAudioActive ? 'Playing sound' : 'Sound ready') : 'Sound muted'}
                  >
                    <span className="text-[10px] mr-1">AUDIO</span>
                    <span
                      className={`inline-block w-1 rounded-full transition-all duration-75 ${
                        isAudioActive && soundEnabled ? 'h-3.5 bg-amber-500 animate-pulse' : 'h-1.5 bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                    <span
                      className={`inline-block w-1 rounded-full transition-all duration-75 ${
                        isAudioActive && soundEnabled ? 'h-4 bg-amber-500' : 'h-1 bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                    <span
                      className={`inline-block w-1 rounded-full transition-all duration-75 ${
                        isAudioActive && soundEnabled ? 'h-2.5 bg-amber-500 animate-pulse' : 'h-1.5 bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Minimal • Playful • Premium • Satisfying
                </p>
              </div>
            </div>

            {/* Mobile Sound Control Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                id="mobile-sound-toggle-btn"
                onClick={handleToggleSound}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  soundEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
              </button>
            </div>
          </div>

          {/* Center: Game Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
            <button
              id="nav-tab-spend"
              onClick={() => handleTabClick('spend')}
              onMouseEnter={() => sound.playHover()}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeGame === 'spend'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Spend Your Money</span>
            </button>

            <button
              id="nav-tab-gold"
              onClick={() => handleTabClick('gold')}
              onMouseEnter={() => sound.playHover()}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeGame === 'gold'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <span>Earn the Gold</span>
            </button>

            <button
              id="nav-tab-movement"
              onClick={() => handleTabClick('movement')}
              onMouseEnter={() => sound.playHover()}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeGame === 'movement'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4 text-sky-500" />
              <span>How Much Moved</span>
            </button>

            <button
              id="nav-tab-boxes"
              onClick={() => handleTabClick('boxes')}
              onMouseEnter={() => sound.playHover()}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeGame === 'boxes'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-violet-500" />
              <span>Stacking Boxes</span>
            </button>
          </nav>

          {/* Right: Sound System Persistent Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sound On / Off Toggle */}
            <button
              id="desktop-sound-toggle-btn"
              onClick={handleToggleSound}
              onMouseEnter={() => sound.playHover()}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                soundEnabled
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
              }`}
              title={soundEnabled ? 'Click to Mute Sound' : 'Click to Enable Sound'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="tracking-wide">🔊 Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="tracking-wide">🔇 Sound Off</span>
                </>
              )}
            </button>

            {/* Volume range slider */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <input
                id="header-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                disabled={!soundEnabled}
                className="w-18 accent-amber-500 cursor-pointer disabled:opacity-30 h-1.5"
                title="Master volume"
              />
              <span className="text-[11px] font-mono text-slate-500 w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Sound Lab Modal Trigger */}
            <button
              id="open-sound-tester-btn"
              onClick={() => {
                sound.playPanelOpen();
                onOpenSoundTester();
              }}
              onMouseEnter={() => sound.playHover()}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Open Sound Lab & Inspector"
            >
              <Sliders className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
