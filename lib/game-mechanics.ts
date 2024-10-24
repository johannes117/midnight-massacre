// /lib/game-mechanics.ts
import type { 
  GameState, 
  Choice, 
  TimeOfNight,
  StalkerPresence,
  StatusEffect
} from './types';

export class GameMechanics {
  private static readonly MAX_SURVIVAL_SCORE = 100;
  private static readonly MIN_SURVIVAL_SCORE = 0;
  private static readonly MAX_TENSION = 10;
  private static readonly TOTAL_TURNS = 30;
  private static readonly TURNS_PER_PHASE = 6;
  private static readonly CONSECUTIVE_FAILURES_LIMIT = 3;

  // Base DC ranges for different risk levels
  private static readonly DC_RANGES = {
    EASY: { min: 5, max: 8 },
    MEDIUM: { min: 9, max: 12 },
    HARD: { min: 13, max: 16 },
    DEADLY: { min: 17, max: 20 }
  };

  // Stalker presence progression mapping
  private static readonly STALKER_PROGRESSION: Record<StalkerPresence, StalkerPresence> = {
    distant: 'hunting',
    hunting: 'closingIn',
    closingIn: 'imminent',
    imminent: 'imminent'
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
      companions: [],
      progress: {
        currentTurn: 1,
        totalTurns: this.TOTAL_TURNS,
        timeOfNight: 'dusk'
      },
      failedRollsCount: 0
    };
  }

  private static getCircumstantialModifier(gameState: GameState, choice: Choice): number {
    let modifier = 0;

    // Status effect modifiers
    if (gameState.statusEffects.includes('injured')) {
      modifier -= 2;
    }
    if (gameState.statusEffects.includes('hidden') && choice.type === 'stealth') {
      modifier += 2;
    }
    if (gameState.statusEffects.includes('exposed')) {
      modifier -= 2;
    }

    // Item modifiers
    if (gameState.hasWeapon && choice.type === 'combat') {
      modifier += 2;
    }

    // Critical health modifier
    if (gameState.survivalScore < 50) {
      modifier -= 2;
    }

    // Time of night modifiers
    const timeModifiers: Record<TimeOfNight, number> = {
      dusk: 0,
      midnight: -1,
      lateNight: -2,
      nearDawn: -2,
      dawn: -1
    };
    modifier += timeModifiers[gameState.progress.timeOfNight];

    // Tension modifier
    if (gameState.tension >= 8) {
      modifier -= 1;
    }

    return modifier;
  }

  private static updateStatusEffects(
    currentEffects: StatusEffect[],
    success: boolean,
    choice: Choice
  ): StatusEffect[] {
    const newEffects = [...currentEffects];

    // Remove effects that should be cleared by success
    if (success) {
      if (choice.type === 'escape') {
        newEffects.splice(newEffects.indexOf('exposed'), 1);
      }
      if (choice.type === 'stealth') {
        newEffects.push('hidden');
        newEffects.splice(newEffects.indexOf('exposed'), 1);
      }
    }

    // Add new effects based on failure
    if (!success) {
      if (choice.type === 'combat') {
        newEffects.push('injured');
      }
      if (choice.type === 'stealth') {
        newEffects.push('exposed');
        newEffects.splice(newEffects.indexOf('hidden'), 1);
      }
    }

    // Remove duplicates
    return [...new Set(newEffects)];
  }

  private static updateTension(
    currentTension: number,
    success: boolean,
    choice: Choice,
    stalkerPresence: StalkerPresence
  ): number {
    let tensionDelta = 0;

    // Base tension changes
    if (!success) {
      tensionDelta += 1;
    }

    // Action-specific changes
    if (choice.type === 'combat' || stalkerPresence === 'imminent') {
      tensionDelta += 2;
    }
    if (success && choice.type === 'stealth') {
      tensionDelta -= 1;
    }

    // Calculate new tension within bounds
    return Math.max(0, Math.min(this.MAX_TENSION, currentTension + tensionDelta));
  }

  private static updateStalkerPresence(
    currentPresence: StalkerPresence,
    success: boolean,
    tension: number
  ): StalkerPresence {
    if (!success || tension >= 8) {
      return this.STALKER_PROGRESSION[currentPresence];
    }
    // Allow successful actions to reduce presence if not already distant
    if (success && currentPresence !== 'distant') {
      const presenceOrder: StalkerPresence[] = ['distant', 'hunting', 'closingIn', 'imminent'];
      const currentIndex = presenceOrder.indexOf(currentPresence);
      return presenceOrder[Math.max(0, currentIndex - 1)];
    }
    return currentPresence;
  }

  static resolveAction(choice: Choice, gameState: GameState): {
    success: boolean;
    newGameState: GameState;
    outcomeText: string;
  } {
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = this.getCircumstantialModifier(gameState, choice);
    const finalRoll = roll + modifier;
    const success = finalRoll >= choice.dc;

    // Calculate survival score change
    const survivalDelta = success 
      ? Math.min(25, Math.ceil(choice.dc / 4) * 5)
      : Math.max(-30, choice.riskFactor);

    // Update game state
    const newGameState = { ...gameState };

    // Update failed rolls count
    newGameState.failedRollsCount = success ? 0 : gameState.failedRollsCount + 1;

    // Update core stats
    newGameState.survivalScore = Math.max(
      this.MIN_SURVIVAL_SCORE,
      Math.min(this.MAX_SURVIVAL_SCORE, gameState.survivalScore + survivalDelta)
    );

    // Update tension
    newGameState.tension = this.updateTension(
      gameState.tension,
      success,
      choice,
      gameState.stalkerPresence
    );

    // Update stalker presence
    newGameState.stalkerPresence = this.updateStalkerPresence(
      gameState.stalkerPresence,
      success,
      newGameState.tension
    );

    // Update status effects
    newGameState.statusEffects = this.updateStatusEffects(
      gameState.statusEffects,
      success,
      choice
    );

    // Update encounter count
    if (choice.type === 'combat' || gameState.stalkerPresence === 'imminent') {
      newGameState.encounterCount++;
    }

    // Update turn counter
    newGameState.progress = {
      currentTurn: gameState.progress.currentTurn + 1,
      totalTurns: this.TOTAL_TURNS,
      timeOfNight: this.getTimeOfNight(gameState.progress.currentTurn + 1)
    };

    // Generate outcome text
    const outcomeText = `${success ? 'Success' : 'Failure'}! (Rolled ${roll} + ${modifier} = ${finalRoll}, needed ${choice.dc})`;

    return { success, newGameState, outcomeText };
  }

  static checkGameOver(gameState: GameState | undefined): {
    isOver: boolean;
    ending: 'death' | 'caught' | 'victory' | 'survived' | 'escaped' | '';
  } {
    if (!gameState) return { isOver: false, ending: '' };

    // Death conditions
    if (gameState.survivalScore <= 0) {
      return { isOver: true, ending: 'death' };
    }

    // Check for too many consecutive failures
    if (gameState.failedRollsCount >= this.CONSECUTIVE_FAILURES_LIMIT && 
        gameState.stalkerPresence === 'closingIn') {
      return { isOver: true, ending: 'caught' };
    }

    // Immediate death in imminent presence without weapon
    if (gameState.stalkerPresence === 'imminent' && !gameState.hasWeapon && 
        gameState.tension >= 8) {
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

    // Early escape victory
    if (gameState.hasKey && gameState.survivalScore >= 80) {
      return { isOver: true, ending: 'escaped' };
    }

    return { isOver: false, ending: '' };
  }
}