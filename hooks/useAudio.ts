import { useState, useEffect, useRef } from 'react';

export function useAudio(url: string) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!audio.current) {
      audio.current = new Audio(url);
      audio.current.loop = true;
      audio.current.play().catch(error => console.error("Audio playback failed:", error));
    }

    return () => {
      if (audio.current) {
        audio.current.pause();
        audio.current = null;
      }
    };
  }, [url]);

  const toggleMute = () => {
    if (audio.current) {
      audio.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return { isMuted, toggleMute };
}
