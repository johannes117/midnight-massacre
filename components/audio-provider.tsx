'use client'

import React, { createContext, useContext } from 'react';
import { useAudio } from '@/hooks/useAudio';

const AudioContext = createContext<ReturnType<typeof useAudio> | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioState = useAudio('/audio/spooky-audio.mp3');

  return (
    <AudioContext.Provider value={audioState}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};