// /lib/types.ts

// Core game action types
export type ActionType = 'combat' | 'stealth' | 'escape' | 'search' | 'interact';

// Stalker states - progression from distant to imminent
export type StalkerPresence = 'distant' | 'hunting' | 'closingIn' | 'imminent';

// Status effects that can be applied to the player
export type StatusEffect = 
  | 'injured'    // -2 to all rolls
  | 'hidden'     // +2 to stealth rolls
  | 'exposed'    // -2 to all rolls
  | 'bleeding'   // Decreases survival score over time
  | 'empowered'; // +2 to combat rolls

// Time phases of the night
export type TimeOfNight = 'dusk' | 'midnight' | 'lateNight' | 'nearDawn' | 'dawn';

// Different types of game endings
export type GameEnding = 'death' | 'caught' | 'victory' | 'survived' | 'escaped';

// Tracks the current progress in the game
export interface GameProgress {
  currentTurn: number;
  totalTurns: number;
  timeOfNight: TimeOfNight;
}

// Represents a single choice available to the player
export interface Choice {
  text: string;
  dc: number;           // Difficulty check (5-20)
  riskFactor: number;   // Negative value (-5 to -30)
  rewardValue: number;  // Positive value (5-25)
  type: ActionType;
  logic?: string;       // Explanation of the choice mechanics
  requirements?: {      // Optional requirements for the choice
    item?: 'weapon' | 'key';
    minSurvival?: number;
    status?: StatusEffect[];
  };
}

// Environmental factors that can affect gameplay
export interface EnvironmentalModifiers {
  darkness: number;     // Affects visibility and stealth
  noise: number;        // Affects stealth and detection
  weather: number;      // Affects various checks
}

// Represents an NPC companion
export interface Companion {
  name: string;
  status: 'alive' | 'injured' | 'dead' | 'missing';
  relationship: number;  // 0-100 scale of loyalty
  speciality?: 'combat' | 'stealth' | 'medical' | 'technical';
}

// Combat state tracking
export interface CombatState {
  inCombat: boolean;
  roundCount: number;
  lastActionType?: ActionType;
  damageDealt?: number;
  damageReceived?: number;
}

// Main game state interface
export interface GameState {
  // Core stats
  survivalScore: number;         // 0-100, death at 0
  tension: number;               // 0-10, affects stalker behavior
  
  // Items and inventory
  hasWeapon: boolean;
  hasKey: boolean;
  
  // Gameplay tracking
  encounterCount: number;        // Number of stalker encounters
  failedRollsCount: number;      // Consecutive failed rolls
  
  // State flags
  stalkerPresence: StalkerPresence;
  statusEffects: StatusEffect[];
  
  // Environmental and companion systems
  environmentalModifiers: EnvironmentalModifiers;
  companions: Companion[];
  
  // Progress tracking
  progress: GameProgress;
  
  // Optional combat state
  combatState?: CombatState;
}

// Story generation response format
export interface StoryResponse {
  story: string;
  choices: Choice[];
  gameState: GameState;
  // Optional metadata about the current scene
  metadata?: {
    location?: string;
    intensity?: number;
    suggestedMusic?: string;
    environmentalDescription?: string;
  };
}

// Action resolution response
export interface ActionResolution {
  success: boolean;
  newGameState: GameState;
  outcomeText: string;
  consequences?: {
    statusEffectsGained: StatusEffect[];
    statusEffectsLost: StatusEffect[];
    survivalChange: number;
    tensionChange: number;
  };
}