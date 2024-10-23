// /lib/types.ts
export type ActionType = 'combat' | 'stealth' | 'escape' | 'search' | 'interact';
export type StalkerPresence = 'distant' | 'hunting' | 'closingIn' | 'imminent';
export type StatusEffect = 'injured' | 'hidden' | 'exposed';
export type TimeOfNight = 'dusk' | 'midnight' | 'lateNight' | 'nearDawn' | 'dawn';

export interface GameProgress {
  currentTurn: number;
  totalTurns: number;
  timeOfNight: TimeOfNight;
}

export interface Choice {
  text: string;
  dc: number;
  riskFactor: number;
  rewardValue: number;
  type: ActionType;
  logic?: string;
}

export interface EnvironmentalModifiers {
  darkness: number;
  noise: number;
  weather: number;
}

export interface Companion {
  name: string;
  status: 'alive' | 'injured' | 'dead';
}

export interface GameState {
  survivalScore: number;
  hasWeapon: boolean;
  hasKey: boolean;
  tension: number;
  encounterCount: number;
  stalkerPresence: StalkerPresence;
  statusEffects: StatusEffect[];
  environmentalModifiers: EnvironmentalModifiers;
  companions: Companion[];
  progress: GameProgress;
}