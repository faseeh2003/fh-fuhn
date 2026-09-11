import React, { useState, useEffect, useRef } from 'react';
import { 
  Coins, 
  Pickaxe, 
  Sparkles, 
  RotateCcw, 
  TrendingUp, 
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { GoldUpgrade } from '../../types';
import sound from '../../services/soundEngine';

const INITIAL_UPGRADES: GoldUpgrade[] = [
  {
    id: 'hand_trowel',
    name: 'Copper Trowel',
    cost: 15,
    gps: 0.8,
    gpc: 0,
    count: 0,
    icon: '🥄',
    description: 'Sifts through river gravel for small flakes.',
    unlocked: true,
  },
  {
    id: 'iron_pickaxe',
    name: 'Tempered Pickaxe',
    cost: 100,
    gps: 5,
    gpc: 1,
    count: 0,
    icon: '⛏️',
    description: 'Chips into quartz veins. Increases click power!',
    unlocked: true,
  },
  {
    id: 'sluice_box',
    name: 'Hydraulic Sluice Box',
    cost: 600,
    gps: 24,
    gpc: 0,
    count: 0,
    icon: '🌊',
    description: 'Riffles capture dense nuggets washed by mountain streams.',
    unlocked: true,
  },
  {
    id: 'prospector_crew',
    name: 'Prospector Crew',
    cost: 3200,
    gps: 110,
    gpc: 3,
    count: 0,
    icon: '🤠',
    description: 'Experienced miners staking claims in rich canyons.',
    unlocked: true,
  },
  {
    id: 'steam_drill',
    name: 'Pneumatic Steam Drill',
    cost: 18000,
    gps: 520,
    gpc: 10,
    count: 0,
    icon: '⚙️',
    description: 'Bores through solid granite with pressurized power.',
    unlocked: false,
  },
  {
    id: 'deep_shaft',
    name: 'Subterranean Lode',
    cost: 95000,
    gps: 2400,
    gpc: 25,
    count: 0,
    icon: '🏔️',
    description: 'Accesses pristine mother-lodes deep underground.',
    unlocked: false,
  },
  {
    id: 'alchemy_crucible',
    name: 'Philosopher’s Crucible',
    cost: 500000,
    gps: 12500,
    gpc: 100,
    count: 0,
    icon: '⚗️',
    description: 'Transmutes baser minerals into pure radiant 24K gold.',
    unlocked: false,
  },
];

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  val: number;
}

export const EarnTheGoldGame: React.FC = () => {
  const [gold, setGold] = useState<number>(() => {
    const saved = localStorage.getItem('sound_gold_balance');
    return saved ? parseFloat(saved) : 0;
  });
  const [totalMined, setTotalMined] = useState<number>(() => {
    const saved = localStorage.getItem('sound_gold_total');
    return saved ? parseFloat(saved) : 0;
  });
  const [upgrades, setUpgrades] = useState<GoldUpgrade[]>(() => {
    const saved = localStorage.getItem('sound_gold_upgrades');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_UPGRADES;
      }
    }
    return INITIAL_UPGRADES;
  });

  const [clickParticles, setClickParticles] = useState<ClickParticle[]>([]);
  const [isCoinPressed, setIsCoinPressed] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Milestones tracking to prevent duplicate audio triggers
  const achievedMilestones = useRef<Set<string>>(new Set());

  // Calculate GPS (Gold per Second) & GPC (Gold per Click)
  const gps = upgrades.reduce((acc, u) => acc + u.gps * u.count, 0);
  const gpc = 1 + upgrades.reduce((acc, u) => acc + u.gpc * u.count, 0);

  // Periodic passive income (runs smoothly at 20 ticks per second)
  // Notice: We intentionally do NOT play audio every second, as requested!
  useEffect(() => {
    if (gps <= 0) return;
    const interval = setInterval(() => {
      const delta = gps / 20;
      setGold((prev) => {
        const next = prev + delta;
        localStorage.setItem('sound_gold_balance', String(next));
        return next;
      });
      setTotalMined((prev) => {
        const next = prev + delta;
        localStorage.setItem('sound_gold_total', String(next));
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gps]);

  // Milestone triggers for audio
  useEffect(() => {
    // Large gold milestones: 1K, 10K, 100K, 1M
    const milestones = [
      { threshold: 1000, key: 'gold_1k', label: '1,000 Gold Mined' },
      { threshold: 10000, key: 'gold_10k', label: '10,000 Gold Mined' },
      { threshold: 100000, key: 'gold_100k', label: '100,000 Gold Mined' },
      { threshold: 1000000, key: 'gold_1m', label: '1,000,000 Gold Mined' },
    ];

    for (const m of milestones) {
      if (totalMined >= m.threshold && !achievedMilestones.current.has(m.key)) {
        achievedMilestones.current.add(m.key);
        sound.playGoldMilestone('gold_milestone');
        showToast(`🏆 Milestone: ${m.label}!`);
        break;
      }
    }

    // Major production increases: 50 GPS, 500 GPS, 2000 GPS
    const prodMilestones = [
      { threshold: 50, key: 'gps_50', label: 'Production Reached 50 Gold/sec' },
      { threshold: 500, key: 'gps_500', label: 'Production Reached 500 Gold/sec' },
      { threshold: 2500, key: 'gps_2500', label: 'Production Reached 2,500 Gold/sec' },
    ];

    for (const p of prodMilestones) {
      if (gps >= p.threshold && !achievedMilestones.current.has(p.key)) {
        achievedMilestones.current.add(p.key);
        sound.playGoldMilestone('major_production');
        showToast(`⚡ High Output: ${p.label}!`);
        break;
      }
    }
  }, [totalMined, gps]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const handleCoinClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 1. Play rapid-click friendly soft gold sound
    sound.playGoldClick();

    // 2. Add gold
    setGold((prev) => prev + gpc);
    setTotalMined((prev) => prev + gpc);

    // 3. Spawn visual particle
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newParticle: ClickParticle = {
      id: Date.now() + Math.random(),
      x,
      y,
      val: gpc,
    };
    setClickParticles((prev) => [...prev.slice(-15), newParticle]);

    // Animate coin squeeze
    setIsCoinPressed(true);
    setTimeout(() => setIsCoinPressed(false), 80);
  };

  const handleBuyUpgrade = (upgrade: GoldUpgrade) => {
    if (gold < upgrade.cost) {
      sound.playCantAfford();
      return;
    }

    // Deduct cost and increment
    setGold((prev) => prev - upgrade.cost);
    const isFirstEverUpgrade = upgrades.every((u) => u.count === 0);

    const nextUpgrades = upgrades.map((u) => {
      if (u.id === upgrade.id) {
        return {
          ...u,
          count: u.count + 1,
          cost: Math.round(u.cost * 1.18),
        };
      }
      return u;
    });

    // Check unlocking next tier
    const currentTotalBought = nextUpgrades.reduce((a, b) => a + b.count, 0);
    if (currentTotalBought >= 3 && !nextUpgrades[4].unlocked) {
      nextUpgrades[4].unlocked = true;
      sound.playGoldMilestone('unlock_element');
      showToast('🔓 Unlocked: Pneumatic Steam Drill!');
    }
    if (currentTotalBought >= 8 && !nextUpgrades[5].unlocked) {
      nextUpgrades[5].unlocked = true;
      sound.playGoldMilestone('unlock_element');
      showToast('🔓 Unlocked: Subterranean Lode!');
    }
    if (currentTotalBought >= 15 && !nextUpgrades[6].unlocked) {
      nextUpgrades[6].unlocked = true;
      sound.playGoldMilestone('unlock_element');
      showToast('🔓 Unlocked: Philosopher’s Crucible!');
    }

    setUpgrades(nextUpgrades);
    localStorage.setItem('sound_gold_upgrades', JSON.stringify(nextUpgrades));

    // Audio feedback
    if (isFirstEverUpgrade) {
      sound.playGoldMilestone('first_upgrade');
      showToast('🎉 First Upgrade Purchased!');
    } else {
      sound.playUpgradeBuy();
    }
  };

  const confirmReset = () => {
    // Subtle warning sound only after confirmation, as explicitly instructed!
    sound.playResetWarning();
    setGold(0);
    setTotalMined(0);
    setUpgrades(INITIAL_UPGRADES);
    achievedMilestones.current.clear();
    localStorage.removeItem('sound_gold_balance');
    localStorage.removeItem('sound_gold_total');
    localStorage.removeItem('sound_gold_upgrades');
    setShowResetConfirm(false);
    showToast('Mine reset. Audio warning played.');
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return Math.floor(num).toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm border border-slate-800 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Stat Panel */}
      <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/20 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-semibold tracking-wider uppercase">
            <Coins className="w-4 h-4" />
            <span>Earn the Gold • Acoustic Clicker Engine</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-6xl font-extrabold font-mono text-amber-300 tracking-tight">
              {formatNumber(gold)}
            </span>
            <span className="text-lg text-amber-400/80 font-medium">Gold</span>
          </div>
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-400 pt-1 font-mono">
            <span className="flex items-center gap-1.5 text-amber-200">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>+{gps.toFixed(1)} / sec</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
              <span>+{gpc} / click</span>
            </span>
            <span>•</span>
            <span>Total: {formatNumber(totalMined)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="reset-mine-trigger-btn"
            onClick={() => {
              sound.playPanelOpen();
              setShowResetConfirm(true);
            }}
            onMouseEnter={() => sound.playHover()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Mine</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Clicker vs Upgrades Shop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Gold Nugget */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-center">
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
            Manual Gold Excavation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
            Rapid clicking ascends through an organic pentatonic scale so it stays satisfying and never grating.
          </p>

          {/* Interactive Coin Element */}
          <div
            id="gold-nugget-click-target"
            onClick={handleCoinClick}
            onMouseEnter={() => sound.playHover()}
            className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full cursor-pointer select-none transition-all duration-75 flex items-center justify-center shadow-xl active:shadow-md ${
              isCoinPressed ? 'scale-90 brightness-110' : 'scale-100 hover:scale-105'
            }`}
            style={{
              background: 'radial-gradient(circle at 35% 35%, #fef08a 0%, #f59e0b 50%, #b45309 100%)',
              boxShadow: '0 12px 30px -4px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6)',
            }}
          >
            {/* Inner Ring */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-amber-300/40 flex flex-col items-center justify-center text-amber-950 font-black">
              <span className="text-4xl sm:text-5xl">🪙</span>
              <span className="text-xs sm:text-sm uppercase tracking-widest mt-1 opacity-80">CLICK</span>
            </div>

            {/* Floating Particle Numbers */}
            {clickParticles.map((p) => (
              <div
                key={p.id}
                className="absolute pointer-events-none font-extrabold font-mono text-amber-600 dark:text-amber-300 text-sm animate-particle-fade"
                style={{
                  left: p.x,
                  top: p.y - 20,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                +{p.val}
              </div>
            ))}
          </div>

          <div className="mt-8 text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Click rapidly to test musical pitch modulation</span>
          </div>
        </div>

        {/* Right Column: Upgrades Store */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Pickaxe className="w-5 h-5 text-amber-500" />
              <span>Mining Equipment & Automations</span>
            </h3>
            <span className="text-xs text-slate-500">
              Milestone sounds trigger on key production thresholds
            </span>
          </div>

          <div className="space-y-3">
            {upgrades.map((upgrade) => {
              const canAfford = gold >= upgrade.cost;
              if (!upgrade.unlocked) {
                return (
                  <div
                    key={upgrade.id}
                    className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl grayscale">
                        🔒
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Locked Asset</h4>
                        <p className="text-xs text-slate-400">Purchase preceding mining equipment to unlock.</p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={upgrade.id}
                  id={`upgrade-row-${upgrade.id}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-xl flex items-center justify-center shrink-0">
                      {upgrade.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {upgrade.name}
                        </h4>
                        {upgrade.count > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            x{upgrade.count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {upgrade.description}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs font-mono">
                        {upgrade.gps > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +{upgrade.gps} GPS
                          </span>
                        )}
                        {upgrade.gpc > 0 && (
                          <span className="text-sky-600 dark:text-sky-400">
                            +{upgrade.gpc} Click
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    id={`buy-upgrade-btn-${upgrade.id}`}
                    onClick={() => handleBuyUpgrade(upgrade)}
                    onMouseEnter={() => sound.playHover()}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 font-mono shadow-xs ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer active:scale-95'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>{formatNumber(upgrade.cost)} Gold</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            id="reset-confirm-dialog"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Reset Mine Progress?</h3>
                <p className="text-xs text-slate-500">This will restore your gold balance and upgrades to zero.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              As required by the sound specification, a subtle warning tone will play strictly after confirmation.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                id="cancel-reset-btn"
                onClick={() => {
                  sound.playPanelClose();
                  setShowResetConfirm(false);
                }}
                onMouseEnter={() => sound.playHover()}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                id="confirm-reset-btn"
                onClick={confirmReset}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
              >
                Confirm Reset & Play Warning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
