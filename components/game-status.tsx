import React from 'react';
import { GameState } from '@/lib/types';

interface GameStatusProps {
  gameState: GameState;
  actionOutcome: string | null;
}

export const GameStatus: React.FC<GameStatusProps> = ({ gameState, actionOutcome }) => {
  return (
    <div className="text-orange-400 text-sm text-center pb-2 border-b border-orange-800/20 space-y-1">
      {gameState.survivalScore <= 50 && (
        <div className="text-red-500 font-bold">CRITICAL CONDITION!</div>
      )}
      {gameState.hasWeapon && <div>You are armed</div>}
      {gameState.hasKey && <div>You have found a key</div>}
      {gameState.statusEffects.length > 0 && (
        <div>{gameState.statusEffects.join(', ')}</div>
      )}
      {actionOutcome && (
        <div className={actionOutcome.includes('Success') ? 'text-green-500' : 'text-red-500'}>
          {actionOutcome}
        </div>
      )}
    </div>
  );
};
