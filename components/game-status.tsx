import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Skull, Shield, Ghost } from "lucide-react";
import { GameState } from '@/lib/types';

interface GameStatusProps {
  gameState: GameState;
  actionOutcome: string | null;
}

const ActionOutcomeAlert = ({ outcome }: { outcome: string }) => {
  const isSuccess = outcome.toLowerCase().includes('success');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`rounded-lg p-3 ${
        isSuccess ? 'bg-green-900/20 border-green-900' : 'bg-red-900/20 border-red-900'
      }`}
    >
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <Shield className="w-5 h-5 text-green-400" />
        ) : (
          <Skull className="w-5 h-5 text-red-400" />
        )}
        <span className={isSuccess ? 'text-green-400' : 'text-red-400'}>
          {outcome}
        </span>
      </div>
    </motion.div>
  );
};

const StatusEffectsList = ({ effects }: { effects: string[] }) => {
  const effectIcons = {
    injured: <Heart className="w-4 h-4 text-red-500" />,
    hidden: <Ghost className="w-4 h-4 text-blue-400" />,
    exposed: <Shield className="w-4 h-4 text-yellow-500" />,
    bleeding: <Heart className="w-4 h-4 text-red-600" />,
    empowered: <Shield className="w-4 h-4 text-green-500" />
  };

  return (
    <div className="flex flex-wrap gap-2">
      {effects.map((effect) => (
        <motion.div
          key={effect}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/30 text-xs"
        >
          {effectIcons[effect as keyof typeof effectIcons]}
          <span className="capitalize">{effect}</span>
        </motion.div>
      ))}
    </div>
  );
};

export const GameStatus: React.FC<GameStatusProps> = ({ gameState, actionOutcome }) => {
  return (
    <div className="space-y-3 mb-4">
      {/* Critical Status Alerts */}
      <AnimatePresence>
        {gameState.survivalScore <= 50 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" className="bg-red-900/20 border-red-900">
              <AlertDescription className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-bold text-red-400">CRITICAL CONDITION!</span>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {gameState.tension >= 8 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" className="bg-orange-900/20 border-orange-900">
              <AlertDescription className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-orange-400">Stalker is very close!</span>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Outcome */}
      <AnimatePresence>
        {actionOutcome && (
          <ActionOutcomeAlert outcome={actionOutcome} />
        )}
      </AnimatePresence>

      {/* Status Effects */}
      {gameState.statusEffects.length > 0 && (
        <div className="text-sm">
          <StatusEffectsList effects={gameState.statusEffects} />
        </div>
      )}
    </div>
  );
};