// /lib/types.ts
export type ActionType = 'combat' | 'stealth' | 'escape' | 'search';
export type StalkerPresence = 'distant' | 'hunting' | 'closingIn' | 'imminent';
export type StatusEffect = 'injured' | 'hidden' | 'exposed';

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

export interface GameState {
  survivalScore: number;
  hasWeapon: boolean;
  hasKey: boolean;
  tension: number;
  encounterCount: number;
  stalkerPresence: StalkerPresence;
  statusEffects: StatusEffect[];
  environmentalModifiers: EnvironmentalModifiers;
}

export interface StoryResponse {
  story: string;
  choices: Choice[];
  gameState: GameState;
}

export interface ActionOutcome {
  success: boolean;
  newGameState: GameState;
  outcomeText: string;
}

export interface GameOverState {
  isOver: boolean;
  ending: 'death' | 'caught' | 'victory' | '';
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}