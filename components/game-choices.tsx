import React from 'react';
import { Button } from "@/components/ui/button";
import { Choice } from '@/lib/types';

interface GameChoicesProps {
  choices: Choice[];
  handleChoice: (choice: Choice) => void;
  isLoading: boolean;
}

export const GameChoices: React.FC<GameChoicesProps> = ({ choices, handleChoice, isLoading }) => {
  return (
    <div className="flex flex-col gap-4">
      {choices.map((choice, index) => (
        <Button
          key={index}
          onClick={() => handleChoice(choice)}
          className="w-full bg-orange-900/50 hover:bg-orange-800/70 text-orange-100 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out flex flex-col items-center justify-center min-h-[4rem]"
          disabled={isLoading}
        >
          <span className="text-base sm:text-lg font-medium leading-tight break-words choice-text text-center">
            {choice.text}
          </span>
        </Button>
      ))}
    </div>
  );
};