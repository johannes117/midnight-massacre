import { useState, useEffect, useRef } from 'react';

export function useAudio(url: string) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audio.current = new Audio(url);
      audio.current.loop = true;
      audio.current.addEventListener('canplaythrough', () => setIsLoaded(true));
    }

    return () => {
      if (audio.current) {
        audio.current.pause();
        audio.current.removeEventListener('canplaythrough', () => setIsLoaded(true));
        audio.current = null;
      }
    };
  }, [url]);

  const play = () => {
    if (audio.current && isLoaded) {
      audio.current.play().catch(error => console.error("Audio playback failed:", error));
    }
  };

  const toggleMute = () => {
    if (audio.current) {
      audio.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return { isMuted, toggleMute, play };
}
