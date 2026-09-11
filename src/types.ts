export type ActiveGame = 'spend' | 'gold' | 'movement' | 'boxes';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0 to 1
}

export interface SpendItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  category: 'everyday' | 'luxury' | 'real_estate' | 'mega_assets' | 'wonders';
  description: string;
}

export interface GoldUpgrade {
  id: string;
  name: string;
  cost: number;
  gps: number; // gold per second
  gpc: number; // gold per click bonus
  count: number;
  icon: string;
  description: string;
  unlocked: boolean;
}

export interface MovementScaleItem {
  id: string;
  title: string;
  speedKmPerSec: number;
  description: string;
  iconName: string;
  color: string;
  tier: 'planetary' | 'stellar' | 'galactic' | 'universal';
  funFact: string;
}

export interface BoxLayer {
  y: number;
  x: number;
  width: number;
  height: number;
  color: string;
  score: number;
  isPerfect: boolean;
}
