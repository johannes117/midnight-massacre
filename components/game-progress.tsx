import React from 'react';
import { motion } from "framer-motion";
import { Moon, Sun, Clock, Skull } from 'lucide-react';
import { GameState, TimeOfNight } from '@/lib/types';

interface GameProgressProps {
  gameState: GameState;
}

const timeIcons: Record<TimeOfNight, JSX.Element> = {
  dusk: <Sun className="w-5 h-5 text-orange-500" />,
  midnight: <Moon className="w-5 h-5 text-indigo-400" />,
  lateNight: <Moon className="w-5 h-5 text-purple-400" />,
  nearDawn: <Clock className="w-5 h-5 text-blue-400" />,
  dawn: <Sun className="w-5 h-5 text-yellow-400" />
};

const timeColors: Record<TimeOfNight, string> = {
  dusk: 'from-orange-600/50 to-purple-900/50',
  midnight: 'from-indigo-900/50 to-purple-900/50',
  lateNight: 'from-purple-900/50 to-blue-900/50',
  nearDawn: 'from-blue-900/50 to-indigo-400/50',
  dawn: 'from-indigo-400/50 to-orange-400/50'
};

export default function GameProgress({ gameState }: GameProgressProps) {
  const progressPercentage = (gameState.progress.currentTurn / gameState.progress.totalTurns) * 100;
  
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        {/* Time Indicator */}
        <div className="flex items-center gap-2">
          {timeIcons[gameState.progress.timeOfNight]}
          <span className="text-sm capitalize">{gameState.progress.timeOfNight}</span>
        </div>
        
        {/* Turn Counter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-orange-300">
            Turn {gameState.progress.currentTurn}/{gameState.progress.totalTurns}
          </span>
          <motion.div
            animate={{
              rotate: gameState.stalkerPresence === 'imminent' ? [0, 15, -15, 0] : 0
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Skull className={`w-5 h-5 ${
              gameState.stalkerPresence === 'imminent' ? 'text-red-500' :
              gameState.stalkerPresence === 'closingIn' ? 'text-orange-500' :
              gameState.stalkerPresence === 'hunting' ? 'text-yellow-500' :
              'text-green-500'
            }`} />
          </motion.div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-2 bg-black/30 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${timeColors[gameState.progress.timeOfNight]}`}
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Turn Markers */}
        <div className="absolute inset-0 flex justify-between px-1">
          {[1, 2, 3, 4].map((phase) => (
            <div
              key={phase}
              className={`w-0.5 h-full ${
                progressPercentage >= (phase * 25) ? 'bg-orange-500/50' : 'bg-gray-500/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
