import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  ShoppingBag, 
  RotateCcw, 
  Receipt, 
  Sparkles, 
  DollarSign, 
  AlertCircle,
  Plus,
  Minus,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { SpendItem } from '../../types';
import sound from '../../services/soundEngine';

const STARTING_BALANCE = 100_000_000_000; // $100 Billion

const ITEMS: SpendItem[] = [
  {
    id: 'coffee',
    name: 'Artisan Latte',
    price: 5,
    icon: '☕',
    category: 'everyday',
    description: 'Double shot oat milk vanilla latte.'
  },
  {
    id: 'book',
    name: 'Hardcover Book',
    price: 25,
    icon: '📚',
    category: 'everyday',
    description: 'Bestselling design & science masterpiece.'
  },
  {
    id: 'game_console',
    name: 'Pro Gaming Console',
    price: 500,
    icon: '🎮',
    category: 'everyday',
    description: 'Next-gen raytracing with dual controllers.'
  },
  {
    id: 'smartphone',
    name: 'Flagship Smartphone',
    price: 1200,
    icon: '📱',
    category: 'everyday',
    description: 'Titanium chassis, 120Hz display, 1TB storage.'
  },
  {
    id: 'rolex',
    name: 'Rolex Cosmograph Daytona',
    price: 35000,
    icon: '⌚',
    category: 'luxury',
    description: 'Solid platinum chronometer.'
  },
  {
    id: 'sports_car',
    name: 'Electric Hypercar',
    price: 250000,
    icon: '🏎️',
    category: 'luxury',
    description: '0-60 mph in 1.9 seconds with carbon ceramic brakes.'
  },
  {
    id: 'villa',
    name: 'Malibu Oceanfront Villa',
    price: 15000000,
    icon: '🏖️',
    category: 'real_estate',
    description: 'Private beach access, infinity pool, 8 bedrooms.'
  },
  {
    id: 'superbowl_ad',
    name: 'Super Bowl 30-Second Commercial',
    price: 7000000,
    icon: '📺',
    category: 'luxury',
    description: 'Broadcasted to 120+ million live viewers.'
  },
  {
    id: 'private_jet',
    name: 'Gulfstream G700 Private Jet',
    price: 75000000,
    icon: '✈️',
    category: 'mega_assets',
    description: 'Intercontinental range with master stateroom.'
  },
  {
    id: 'mega_yacht',
    name: '400ft Luxury Mega Yacht',
    price: 450000000,
    icon: '🛥️',
    category: 'mega_assets',
    description: 'Twin helipads, submarine bay, and 30 crew members.'
  },
  {
    id: 'nba_team',
    name: 'Championship NBA Franchise',
    price: 4200000000,
    icon: '🏀',
    category: 'mega_assets',
    description: 'State-of-the-art arena, global fanbase, top athletes.'
  },
  {
    id: 'skyscraper',
    name: 'Manhattan Glass Skyscraper',
    price: 8500000000,
    icon: '🏙️',
    category: 'real_estate',
    description: '80 floors of prime Hudson Yards commercial space.'
  },
  {
    id: 'space_station',
    name: 'Commercial Orbital Station Module',
    price: 25000000000,
    icon: '🛰️',
    category: 'wonders',
    description: 'Pressurized zero-gravity laboratory in Low Earth Orbit.'
  },
  {
    id: 'mona_lisa',
    name: 'The Mona Lisa (Private Purchase)',
    price: 60000000000,
    icon: '🖼️',
    category: 'wonders',
    description: 'Da Vinci’s priceless masterpiece (insured valuation).'
  }
];

export const SpendYourMoneyGame: React.FC = () => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [hasTriggeredZeroCelebration, setHasTriggeredZeroCelebration] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const totalSpent = useMemo(() => {
    return Object.entries(quantities).reduce<number>((acc, [id, qty]) => {
      const item = ITEMS.find((i) => i.id === id);
      const numericQty = Number(qty) || 0;
      return acc + (item ? item.price * numericQty : 0);
    }, 0);
  }, [quantities]);

  const remainingBalance = STARTING_BALANCE - totalSpent;
  const isZeroReached = remainingBalance === 0;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const handleBuy = (item: SpendItem, amount: number = 1) => {
    const cost = item.price * amount;
    if (cost > remainingBalance) {
      sound.playCantAfford();
      showToast(`Cannot afford ${amount > 1 ? `${amount}x ` : ''}${item.name}!`);
      return;
    }

    const nextQuantities = {
      ...quantities,
      [item.id]: (quantities[item.id] || 0) + amount,
    };
    setQuantities(nextQuantities);

    // Audio feedback logic
    const nextRemaining = remainingBalance - cost;
    if (nextRemaining === 0) {
      // REACHED EXACTLY $0!
      sound.playZeroBalance();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setHasTriggeredZeroCelebration(true);
      showToast("🎉 EXACT $0 REACHED! You've spent every penny!");
    } else if (cost >= 1_000_000_000) {
      // Big luxury spend audio
      sound.playBigSpend();
    } else {
      // Standard subtle cash/coin audio
      sound.playBuy();
    }
  };

  const handleSell = (item: SpendItem, amount: number = 1) => {
    const currentQty = quantities[item.id] || 0;
    if (currentQty <= 0) return;

    const sellCount = Math.min(currentQty, amount);
    const nextQuantities = {
      ...quantities,
      [item.id]: currentQty - sellCount,
    };
    if (nextQuantities[item.id] === 0) {
      delete nextQuantities[item.id];
    }
    setQuantities(nextQuantities);

    // Selling sound: slightly different positive transaction sound
    sound.playSell();

    if (hasTriggeredZeroCelebration && remainingBalance + item.price * sellCount > 0) {
      setHasTriggeredZeroCelebration(false);
    }
  };

  const handleReset = () => {
    sound.playButtonClick();
    setQuantities({});
    setHasTriggeredZeroCelebration(false);
    showToast("Fortune reset to $100,000,000,000");
  };

  // Helper button to reach exactly $0 to test the prompt requirement effortlessly
  const handleSpendToExactZero = () => {
    // Fill with Mona Lisa (60B) + Orbital Station (25B) + Manhattan Skyscraper (8.5B) + NBA Team (4.2B) + Mega Yacht (450M) + Jet (75M) + Malibu (15M) + Super Bowl (7M) + Hypercar (250K) + ...
    // Exact combination that sums to 100,000,000,000:
    // Let's compute exact items:
    const exactPreset: Record<string, number> = {
      mona_lisa: 1, // 60,000,000,000
      space_station: 1, // 25,000,000,000 -> 85B
      skyscraper: 1, // 8,500,000,000 -> 93.5B
      nba_team: 1, // 4,200,000,000 -> 97.7B
      mega_yacht: 5, // 2,250,000,000 -> 99.95B
      private_jet: 0, 
      villa: 3, // 45,000,000 -> 99.995B
      superbowl_ad: 0,
      sports_car: 19, // 4,750,000 -> 99.99975B
      rolex: 7, // 245,000 -> 99.999995B
      coffee: 1000 // 5,000 -> EXACT 100,000,000,000!
    };

    setQuantities(exactPreset);
    sound.playZeroBalance();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 }
    });
    setHasTriggeredZeroCelebration(true);
    showToast("🎉 Exact $0 Reached! Listen to the harmonic resolution!");
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const spentPercentage = Math.min(100, (totalSpent / STARTING_BALANCE) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm border border-slate-800 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hero Balance Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold tracking-wider uppercase">
              <DollarSign className="w-4 h-4" />
              <span>Spend Your Money • $100 Billion Fortune</span>
            </div>
            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-emerald-300">
              {formatMoney(remainingBalance)}
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Can you bring this astronomical fortune down to exactly{' '}
              <strong className="text-amber-300 font-bold">$0</strong>?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              id="spend-exact-zero-btn"
              onClick={handleSpendToExactZero}
              onMouseEnter={() => sound.playHover()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Trophy className="w-4 h-4" />
              <span>Reach Exact $0 (Demo)</span>
            </button>
            <button
              id="view-receipt-btn"
              onClick={() => {
                sound.playPanelOpen();
                setShowReceipt(!showReceipt);
              }}
              onMouseEnter={() => sound.playHover()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>{showReceipt ? 'Hide Receipt' : 'View Receipt'}</span>
            </button>
            <button
              id="reset-fortune-btn"
              onClick={handleReset}
              onMouseEnter={() => sound.playHover()}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 transition-colors"
              title="Reset Fortune"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Spent: {spentPercentage.toFixed(2)}% ({formatMoney(totalSpent)})</span>
            <span className={isZeroReached ? 'text-amber-400 font-bold' : ''}>
              {isZeroReached ? 'GOAL ACHIEVED: EXACT $0' : `${formatMoney(remainingBalance)} remaining`}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isZeroReached ? 'bg-gradient-to-r from-amber-400 to-emerald-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${spentPercentage}%` }}
            />
          </div>
        </div>

        {/* Completion Banner if $0 reached */}
        {isZeroReached && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="font-bold text-amber-300 text-sm">Exactly $0 Reached!</h4>
                <p className="text-xs text-slate-200">
                  Glorious harmonic completion sound triggered. All $100 Billion liquidated!
                </p>
              </div>
            </div>
            <button
              onClick={() => sound.playZeroBalance()}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Replay Audio</span>
            </button>
          </div>
        )}
      </div>

      {/* Receipt Drawer/Section */}
      {showReceipt && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Shopping Receipt</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Items Purchased: {Object.values(quantities).reduce<number>((a, b) => a + (Number(b) || 0), 0)}
            </span>
          </div>

          {Object.keys(quantities).length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Your shopping cart is empty. Start spending below!</p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-60 overflow-y-auto">
              {Object.entries(quantities).map(([id, qty]) => {
                const item = ITEMS.find((i) => i.id === id);
                if (!item) return null;
                const numericQty = Number(qty) || 0;
                return (
                  <div key={id} className="py-2.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                      <span className="text-xs text-slate-500">x{numericQty}</span>
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {formatMoney(item.price * numericQty)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between font-bold text-sm">
            <span>Total Spent</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatMoney(totalSpent)}</span>
          </div>
        </div>
      )}

      {/* Items Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <span>Catalog Items</span>
          </h3>
          <span className="text-xs text-slate-500">
            Hover & Click items to trigger acoustic cash & coin cues
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ITEMS.map((item) => {
            const currentQty = quantities[item.id] || 0;
            const canAfford = remainingBalance >= item.price;
            const isMegaAsset = item.price >= 1_000_000_000;

            return (
              <div
                key={item.id}
                id={`item-card-${item.id}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    {isMegaAsset && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300/40">
                        Mega Asset
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{item.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                    <div className="mt-2 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatMoney(item.price)}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`sell-btn-${item.id}`}
                      onClick={() => handleSell(item, 1)}
                      onMouseEnter={() => sound.playHover()}
                      disabled={currentQty <= 0}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      title="Sell 1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono font-semibold text-xs text-slate-900 dark:text-white">
                      {currentQty}
                    </span>
                    <button
                      id={`buy-btn-${item.id}`}
                      onClick={() => handleBuy(item, 1)}
                      onMouseEnter={() => sound.playHover()}
                      disabled={!canAfford}
                      className="w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-xs"
                      title="Buy 1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Buy 10 or Max */}
                  <button
                    id={`buy-max-btn-${item.id}`}
                    onClick={() => {
                      const maxCanBuy = Math.floor(remainingBalance / item.price);
                      if (maxCanBuy <= 0) {
                        sound.playCantAfford();
                        showToast(`Cannot afford any more ${item.name}!`);
                      } else {
                        const buyAmount = Math.min(maxCanBuy, 10);
                        handleBuy(item, buyAmount);
                      }
                    }}
                    onMouseEnter={() => sound.playHover()}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    +10x
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
