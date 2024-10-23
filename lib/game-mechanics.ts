// /lib/game-mechanics.ts
import type { 
  GameState, 
  Choice, 
  TimeOfNight,
} from './types';

export class GameMechanics {
  private static readonly MAX_SURVIVAL_SCORE = 150;
  private static readonly MIN_SURVIVAL_SCORE = 0;
  private static readonly TOTAL_TURNS = 30;
  private static readonly TURNS_PER_PHASE = 6;

  // Base DC ranges for different risk levels
  private static readonly DC_RANGES = {
    EASY: { min: 5, max: 8 },
    MEDIUM: { min: 9, max: 12 },
    HARD: { min: 13, max: 16 },
    DEADLY: { min: 17, max: 20 }
  };

  static getTimeOfNight(currentTurn: number): TimeOfNight {
    if (currentTurn <= this.TURNS_PER_PHASE) return 'dusk';
    if (currentTurn <= this.TURNS_PER_PHASE * 2) return 'midnight';
    if (currentTurn <= this.TURNS_PER_PHASE * 3) return 'lateNight';
    if (currentTurn <= this.TURNS_PER_PHASE * 4) return 'nearDawn';
    return 'dawn';
  }

  static getInitialGameState(): GameState {
    return {
      survivalScore: 100,
      hasWeapon: false,
      hasKey: false,
      tension: 0,
      encounterCount: 0,
      stalkerPresence: 'distant',
      statusEffects: [],
      environmentalModifiers: {
        darkness: 0,
        noise: 0,
        weather: 0
      },
      companions: [
        { name: 'Alex', status: 'alive' },
        { name: 'Jamie', status: 'alive' },
        { name: 'Casey', status: 'alive' }
      ],
      progress: {
        currentTurn: 1,
        totalTurns: this.TOTAL_TURNS,
        timeOfNight: 'dusk'
      }
    };
  }

  private static getCircumstantialModifier(gameState: GameState, choice: Choice): number {
    let modifier = 0;

    // Injury makes everything harder
    if (gameState.statusEffects.includes('injured')) {
      modifier -= 2;
    }

    // Being hidden helps with stealth
    if (gameState.statusEffects.includes('hidden') && choice.type === 'stealth') {
      modifier += 2;
    }

    // Being exposed makes everything harder
    if (gameState.statusEffects.includes('exposed')) {
      modifier -= 2;
    }

    // Having a weapon helps with combat
    if (gameState.hasWeapon && choice.type === 'combat') {
      modifier += 2;
    }

    // Critical health makes everything harder
    if (gameState.survivalScore < 50) {
      modifier -= 2;
    }

    return modifier;
  }

  static resolveAction(choice: Choice, gameState: GameState): {
    success: boolean;
    newGameState: GameState;
    outcomeText: string;
  } {
    const { success, newGameState, outcomeText } = this.calculateActionOutcome(choice, gameState);
    
    // Update turn counter and time of night
    newGameState.progress = {
      currentTurn: gameState.progress.currentTurn + 1,
      totalTurns: this.TOTAL_TURNS,
      timeOfNight: this.getTimeOfNight(gameState.progress.currentTurn + 1)
    };

    return { success, newGameState, outcomeText };
  }

  private static calculateActionOutcome(choice: Choice, gameState: GameState): {
    success: boolean;
    newGameState: GameState;
    outcomeText: string;
  } {
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = this.getCircumstantialModifier(gameState, choice);
    const finalRoll = roll + modifier;
    const success = finalRoll >= choice.dc;

    const survivalDelta = success 
      ? Math.ceil(choice.dc / 4) * 5 
      : -Math.ceil(Math.abs(choice.riskFactor) / 2);

    const newGameState = {
      ...gameState,
      survivalScore: Math.min(
        this.MAX_SURVIVAL_SCORE,
        Math.max(this.MIN_SURVIVAL_SCORE, gameState.survivalScore + survivalDelta)
      ),
      tension: Math.min(10, gameState.tension + (success ? 0 : 1)),
      encounterCount: gameState.encounterCount + (choice.type === 'combat' ? 1 : 0)
    };

    // Progress stalker on failure or high tension
    if (!success || newGameState.tension >= 8) {
      const stalkerProgression: Record<GameState['stalkerPresence'], GameState['stalkerPresence']> = {
        distant: 'hunting',
        hunting: 'closingIn',
        closingIn: 'imminent',
        imminent: 'imminent'
      };
      newGameState.stalkerPresence = stalkerProgression[gameState.stalkerPresence];
    }

    const outcomeText = `${success ? 'Success' : 'Failure'}! (Rolled ${roll} + ${modifier} = ${finalRoll}, needed ${choice.dc})`;

    return { success, newGameState, outcomeText };
  }

  static checkGameOver(gameState: GameState | undefined): {
    isOver: boolean;
    ending: 'death' | 'caught' | 'victory' | 'survived' | '';
  } {
    if (!gameState) return { isOver: false, ending: '' };

    // Death conditions
    if (gameState.survivalScore <= 0) {
      return { isOver: true, ending: 'death' };
    }

    if (gameState.stalkerPresence === 'imminent' && !gameState.hasWeapon) {
      return { isOver: true, ending: 'caught' };
    }

    // Victory conditions
    if (gameState.progress.currentTurn >= gameState.progress.totalTurns) {
      // Different victory types based on final state
      if (gameState.hasWeapon && gameState.survivalScore >= 100) {
        return { isOver: true, ending: 'victory' }; // Defeated the stalker
      }
      return { isOver: true, ending: 'survived' }; // Made it to dawn
    }

    return { isOver: false, ending: '' };
  }
}