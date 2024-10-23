import React from 'react';
import { Moon, Sun, Clock } from 'lucide-react';
import { GameState } from '@/lib/types';

interface GameProgressProps {
  gameState: GameState;
}

const timeIcons = {
  dusk: <Sun className="w-5 h-5 text-orange-500" />,
  midnight: <Moon className="w-5 h-5 text-indigo-400" />,
  lateNight: <Moon className="w-5 h-5 text-purple-400" />,
  nearDawn: <Clock className="w-5 h-5 text-blue-400" />,
  dawn: <Sun className="w-5 h-5 text-yellow-400" />
};

const timeColors = {
  dusk: 'from-orange-600/20 to-purple-900/20',
  midnight: 'from-indigo-900/20 to-purple-900/20',
  lateNight: 'from-purple-900/20 to-blue-900/20',
  nearDawn: 'from-blue-900/20 to-indigo-400/20',
  dawn: 'from-indigo-400/20 to-orange-400/20'
};

export default function GameProgress({ gameState }: GameProgressProps) {
  const progressPercentage = (gameState.progress.currentTurn / gameState.progress.totalTurns) * 100;
  
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {timeIcons[gameState.progress.timeOfNight]}
          <span className="capitalize">{gameState.progress.timeOfNight}</span>
        </div>
        <span className="text-orange-300">
          Turn {gameState.progress.currentTurn}/{gameState.progress.totalTurns}
        </span>
      </div>
      
      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
            timeColors[gameState.progress.timeOfNight]
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}