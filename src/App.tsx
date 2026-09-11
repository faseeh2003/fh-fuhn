import React, { useState, useEffect } from 'react';
import { SoundHeader } from './components/SoundHeader';
import { SoundTesterModal } from './components/SoundTesterModal';
import { SpendYourMoneyGame } from './components/games/SpendYourMoneyGame';
import { EarnTheGoldGame } from './components/games/EarnTheGoldGame';
import { ScaleMovementGame } from './components/games/ScaleMovementGame';
import { StackingBoxesGame } from './components/games/StackingBoxesGame';
import { ActiveGame } from './types';
import sound from './services/soundEngine';
import { Volume2, VolumeX, Sliders, Music } from 'lucide-react';

export default function App() {
  const [activeGame, setActiveGame] = useState<ActiveGame>('spend');
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.getEnabled());
  const [volume, setVolume] = useState(sound.getVolume());

  useEffect(() => {
    const unsub = sound.onSettingsChange(() => {
      setSoundEnabled(sound.getEnabled());
      setVolume(sound.getVolume());
    });
    return () => unsub();
  }, []);

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
  };

  const handleVolumeChange = (newVol: number) => {
    sound.setVolume(newVol);
    setVolume(newVol);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Persistent Navigation & Sound Bar */}
      <SoundHeader
        activeGame={activeGame}
        onSelectGame={(game) => setActiveGame(game)}
        onOpenSoundTester={() => setIsTesterOpen(true)}
      />

      {/* Main Game Arena */}
      <main className="flex-1">
        {activeGame === 'spend' && <SpendYourMoneyGame />}
        {activeGame === 'gold' && <EarnTheGoldGame />}
        {activeGame === 'movement' && <ScaleMovementGame />}
        {activeGame === 'boxes' && <StackingBoxesGame />}
      </main>

      {/* Footer with Persistent Audio Controls and Specifications */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-6 transition-colors mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Procedural Audio Engine
            </span>
            <span>•</span>
            <span>Web Audio API (0 KB External Assets)</span>
            <span>•</span>
            <span>Persistent Preference</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              id="footer-sound-toggle-btn"
              onClick={handleToggleSound}
              onMouseEnter={() => sound.playHover()}
              className="flex items-center gap-1.5 font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>🔊 Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                  <span>🔇 Sound Off</span>
                </>
              )}
            </button>

            <button
              id="footer-sound-tester-btn"
              onClick={() => {
                sound.playPanelOpen();
                setIsTesterOpen(true);
              }}
              onMouseEnter={() => sound.playHover()}
              className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Open Sound Lab</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Sound Design Laboratory Modal */}
      <SoundTesterModal
        isOpen={isTesterOpen}
        onClose={() => setIsTesterOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        volume={volume}
        onVolumeChange={handleVolumeChange}
      />
    </div>
  );
}
