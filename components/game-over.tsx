import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from 'lucide-react';
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';

interface GameOverProps {
  isVictory: boolean;
  resetGame: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ isVictory, resetGame }) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-4 text-center"
    >
      <h2 className={`text-3xl font-bold ${isVictory ? 'text-green-500' : 'text-orange-500'}`}>
        {isVictory ? 'You Survived!' : 'Game Over'}
      </h2>
      <div className="flex justify-center gap-4">
        <Button
          onClick={resetGame}
          className="bg-orange-900/50 hover:bg-orange-800/70 text-orange-100"
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={() => router.push('/')}
          className="bg-orange-900/50 hover:bg-orange-800/70 text-orange-100"
        >
          <Home className="h-5 w-5 mr-2" />
          Main Menu
        </Button>
      </div>
    </motion.div>
  );
};