import React from 'react';
import { Button } from "@/components/ui/button";
import { Shield, Ghost, Footprints, Search, HandIcon } from "lucide-react";
import { Choice, ActionType } from '@/lib/types';
import { motion } from "framer-motion";

interface GameChoicesProps {
  choices: Choice[];
  handleChoice: (choice: Choice) => void;
  isLoading: boolean;
}

const ActionIcon = ({ type }: { type: ActionType }) => {
  switch (type) {
    case 'combat':
      return <Shield className="w-5 h-5 text-red-400" />;
    case 'stealth':
      return <Ghost className="w-5 h-5 text-blue-400" />;
    case 'escape':
      return <Footprints className="w-5 h-5 text-green-400" />;
    case 'search':
      return <Search className="w-5 h-5 text-yellow-400" />;
    case 'interact':
      return <HandIcon className="w-5 h-5 text-purple-400" />;
    default:
      return null;
  }
};

const DifficultyBadge = ({ dc }: { dc: number }) => {
  const getDifficultyColor = (dc: number) => {
    if (dc <= 8) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (dc <= 12) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    if (dc <= 16) return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  const getDifficultyLabel = (dc: number) => {
    if (dc <= 8) return 'Easy';
    if (dc <= 12) return 'Medium';
    if (dc <= 16) return 'Hard';
    return 'Deadly';
  };

  return (
    <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(dc)}`}>
      {getDifficultyLabel(dc)} (DC {dc})
    </span>
  );
};

export const GameChoices: React.FC<GameChoicesProps> = ({ choices, handleChoice, isLoading }) => {
  return (
    <div className="space-y-3 overflow-y-auto">
      {choices.map((choice, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="min-h-[4rem]"
        >
          <Button
            onClick={() => handleChoice(choice)}
            className="w-full h-full bg-black/40 hover:bg-black/60 
                     border border-orange-800/50 hover:border-orange-800 
                     text-orange-100 p-4 rounded-lg transition-all duration-300 
                     ease-in-out flex flex-col items-start gap-2 relative
                     overflow-visible"
            disabled={isLoading}
          >
            <div className="w-full flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-shrink-0">
                <ActionIcon type={choice.type} />
                <DifficultyBadge dc={choice.dc} />
              </div>
              <div className="flex items-center gap-2 text-xs flex-shrink-0">
                {choice.riskFactor < -20 && (
                  <span className="text-red-400">High Risk</span>
                )}
                {choice.rewardValue > 20 && (
                  <span className="text-green-400">High Reward</span>
                )}
              </div>
            </div>
            
            <span className="text-left text-sm sm:text-base font-medium leading-tight break-words w-full">
              {choice.text}
            </span>

            {(choice.requirements?.item || choice.requirements?.minSurvival) ? (
              <div className="w-full flex flex-wrap gap-2 mt-1">
                {choice.requirements.item && (
                  <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/50">
                    Requires: {choice.requirements.item}
                  </span>
                )}
                {choice.requirements.minSurvival && (
                  <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/50">
                    Min Survival: {choice.requirements.minSurvival}
                  </span>
                )}
              </div>
            ) : null}
          </Button>
        </motion.div>
      ))}
    </div>
  );
};
