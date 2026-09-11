import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Clock, 
  Orbit, 
  Globe2, 
  Zap, 
  Info,
  Play,
  Pause
} from 'lucide-react';
import { MovementScaleItem } from '../../types';
import sound from '../../services/soundEngine';

const SCALES: MovementScaleItem[] = [
  {
    id: 'earth_rotation',
    title: 'Earth’s Axial Spin',
    speedKmPerSec: 0.465,
    tier: 'planetary',
    iconName: '🌍',
    color: 'from-blue-500 to-emerald-500',
    description: 'The velocity of Earth’s surface at the equator due to daily rotation.',
    funFact: 'Even when sitting perfectly still in a chair, you are traveling eastward faster than the speed of commercial jetliners!'
  },
  {
    id: 'moon_orbit',
    title: 'Moon Orbiting Earth',
    speedKmPerSec: 1.022,
    tier: 'planetary',
    iconName: '🌕',
    color: 'from-slate-400 to-amber-200',
    description: 'The average orbital velocity of the Moon revolving around Earth.',
    funFact: 'The Moon moves over 3,600 kilometers per hour, completing a full orbit every 27.3 days.'
  },
  {
    id: 'earth_sun',
    title: 'Earth Orbiting the Sun',
    speedKmPerSec: 29.78,
    tier: 'stellar',
    iconName: '☀️',
    color: 'from-amber-500 to-orange-600',
    description: 'Earth’s orbital speed racing around the Sun across 940 million kilometers annually.',
    funFact: 'In just 2 minutes, Earth carries you across 3,570 km — equivalent to crossing the entire United States!'
  },
  {
    id: 'solar_system_milkyway',
    title: 'Solar System in the Milky Way',
    speedKmPerSec: 230,
    tier: 'galactic',
    iconName: '🌀',
    color: 'from-indigo-500 to-purple-600',
    description: 'Our Sun and all its planets orbiting the supermassive black hole at Sagittarius A*.',
    funFact: 'It takes our solar system approximately 230 million years to complete a single "Cosmic Year" around the galactic center.'
  },
  {
    id: 'andromeda_approach',
    title: 'Milky Way & Andromeda Approach',
    speedKmPerSec: 110,
    tier: 'galactic',
    iconName: '🌌',
    color: 'from-violet-600 to-fuchsia-600',
    description: 'Mutual gravitational pull drawing the Milky Way and Andromeda toward each other.',
    funFact: 'In about 4.5 billion years, both galaxies will merge into a giant elliptical galaxy nicknamed Milkomeda.'
  },
  {
    id: 'cmb_dipole',
    title: 'Velocity Relative to Cosmic Microwave Background',
    speedKmPerSec: 627,
    tier: 'universal',
    iconName: '✨',
    color: 'from-cyan-500 to-blue-700',
    description: 'Our galaxy’s motion relative to the relic radiation of the Big Bang itself.',
    funFact: 'We are hurtling at an astonishing 2.2 million km/h toward the constellation Hydra and the Great Attractor!'
  }
];

const SURPRISING_MILESTONES = [
  {
    id: 'moon_distance',
    title: 'Lunar Distance Crossed (384,400 km)',
    requiredKm: 384400,
    fact: 'Relative to the Cosmic Microwave Background, you travel the entire Earth-to-Moon distance every 10.2 minutes!'
  },
  {
    id: 'sun_diameter',
    title: 'Sun’s Entire Diameter Crossed (1.39 Million km)',
    requiredKm: 1392700,
    fact: 'In just 37 minutes, you’ve traversed a distance greater than the width of our entire Sun.'
  },
  {
    id: 'mars_close_approach',
    title: 'Close Approach to Mars (54.6 Million km)',
    requiredKm: 54600000,
    fact: 'In 24 hours of cosmic flight, you cover the distance of Mars at its closest orbital encounter with Earth.'
  }
];

export const ScaleMovementGame: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [discoveredMilestones, setDiscoveredMilestones] = useState<string[]>([]);
  const [selectedPresetTime, setSelectedPresetTime] = useState<number | null>(null);

  const activeScale = SCALES[currentIndex];

  // Stopwatch timer for real-time motion
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Compute distance moved for current object
  const effectiveSeconds = selectedPresetTime !== null ? selectedPresetTime : elapsedSeconds;
  const currentDistanceKm = effectiveSeconds * activeScale.speedKmPerSec;
  const totalCmbDistanceKm = effectiveSeconds * 627;

  const handleNext = () => {
    if (currentIndex < SCALES.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      // Play slightly different sound as scale becomes dramatically larger
      sound.playScaleTransition(SCALES[nextIdx].tier);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      sound.playScaleTransition(SCALES[prevIdx].tier);
    }
  };

  const handleSelectScale = (index: number) => {
    if (index !== currentIndex) {
      setCurrentIndex(index);
      sound.playScaleTransition(SCALES[index].tier);
    }
  };

  const triggerDiscoveryMilestone = (mId: string) => {
    if (!discoveredMilestones.includes(mId)) {
      setDiscoveredMilestones((prev) => [...prev, mId]);
    }
    // Play short satisfying discovery sound
    sound.playDiscovery();
  };

  const formatDistance = (km: number) => {
    if (km >= 1_000_000_000) {
      return (km / 1_000_000_000).toFixed(3) + ' Billion km';
    }
    if (km >= 1_000_000) {
      return (km / 1_000_000).toFixed(2) + ' Million km';
    }
    if (km >= 1_000) {
      return (km / 1_000).toFixed(1) + ' Thousand km';
    }
    return km.toFixed(1) + ' km';
  };

  const formatSecondsToReadable = (sec: number) => {
    const s = Math.floor(sec % 60);
    const m = Math.floor((sec / 60) % 60);
    const h = Math.floor(sec / 3600);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${sec.toFixed(1)}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 text-xs sm:text-sm font-semibold tracking-wider uppercase">
              <Compass className="w-4 h-4" />
              <span>How Much Everything Moved • Cosmic Scale Acoustics</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              You are never truly standing still.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              While reading this text, Earth rotates, circles the Sun, and our entire galaxy hurtles across cosmic space.
              Listen to the acoustic resonance expand with each celestial scale.
            </p>
          </div>

          {/* Real-time Session Stopwatch */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs text-indigo-200 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Active Observation Time</span>
            </div>
            <div className="font-mono text-2xl font-bold text-white tracking-wider">
              {formatSecondsToReadable(effectiveSeconds)}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                id="toggle-timer-btn"
                onClick={() => {
                  sound.playButtonClick();
                  setIsRunning(!isRunning);
                }}
                onMouseEnter={() => sound.playHover()}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/50 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isRunning ? 'Pause' : 'Resume'}</span>
              </button>
              <button
                id="reset-timer-btn"
                onClick={() => {
                  sound.playButtonClick();
                  setElapsedSeconds(0);
                  setSelectedPresetTime(null);
                }}
                onMouseEnter={() => sound.playHover()}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Time Presets Pill Row */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 mr-1">Quick time scales:</span>
          {[
            { label: 'Live Stopwatch', sec: null },
            { label: '1 Minute', sec: 60 },
            { label: '10 Minutes', sec: 600 },
            { label: '1 Hour', sec: 3600 },
            { label: '24 Hours (1 Day)', sec: 86400 },
            { label: '1 Year', sec: 31536000 }
          ].map((preset) => {
            const isSelected = selectedPresetTime === preset.sec;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  sound.playButtonClick();
                  setSelectedPresetTime(preset.sec);
                }}
                onMouseEnter={() => sound.playHover()}
                className={`px-3 py-1 rounded-lg transition-all font-mono text-xs ${
                  isSelected
                    ? 'bg-indigo-500 text-white font-semibold shadow-xs'
                    : 'bg-white/5 hover:bg-white/15 text-slate-300'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Celestial Scale Navigator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Navigation Step Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Scale {currentIndex + 1} of {SCALES.length}</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 capitalize">{activeScale.tier} Scale</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="prev-scale-btn"
              onClick={handlePrev}
              onMouseEnter={() => sound.playHover()}
              disabled={currentIndex === 0}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Scale"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="next-scale-btn"
              onClick={handleNext}
              onMouseEnter={() => sound.playHover()}
              disabled={currentIndex === SCALES.length - 1}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs"
              title="Next Scale (Audio deepens)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Active Scale Showcase Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-6xl mb-3 animate-pulse">{activeScale.iconName}</div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {activeScale.title}
            </h3>
            <div className="mt-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold">
              {activeScale.speedKmPerSec.toLocaleString()} km / second
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Approx. {(activeScale.speedKmPerSec * 3600).toLocaleString()} km/h
            </p>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Distance Traversed in {formatSecondsToReadable(effectiveSeconds)}:
              </span>
              <div className="text-3xl sm:text-5xl font-mono font-black text-indigo-600 dark:text-indigo-400 mt-1 tracking-tight">
                {formatDistance(currentDistanceKm)}
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeScale.description}
            </p>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong className="font-semibold">Astronomical Reality: </strong>
                {activeScale.funFact}
              </p>
            </div>
          </div>
        </div>

        {/* Scale Timeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          {SCALES.map((scale, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={scale.id}
                id={`scale-tab-${scale.id}`}
                onClick={() => handleSelectScale(idx)}
                onMouseEnter={() => sound.playHover()}
                className={`p-3 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="text-xl mb-1">{scale.iconName}</div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                  {scale.title}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {scale.speedKmPerSec} km/s
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Surprising Milestones & Discovery Audio Trigger Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Surprising Cosmic Milestones</span>
          </h3>
          <span className="text-xs text-slate-500">
            Click to trigger the satisfying "discovery" sound
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SURPRISING_MILESTONES.map((milestone) => {
            const isUnlocked = totalCmbDistanceKm >= milestone.requiredKm || discoveredMilestones.includes(milestone.id);

            return (
              <div
                key={milestone.id}
                id={`milestone-card-${milestone.id}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      Discovery Milestone
                    </span>
                    {isUnlocked && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Discovered
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {milestone.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {milestone.fact}
                  </p>
                </div>

                <button
                  id={`discover-btn-${milestone.id}`}
                  onClick={() => triggerDiscoveryMilestone(milestone.id)}
                  onMouseEnter={() => sound.playHover()}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Audition Discovery Sound</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
