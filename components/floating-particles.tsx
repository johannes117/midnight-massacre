import React, { useEffect, useState, useMemo } from "react";

interface ParticleProps {
  key: number;
  size: number;
  initialX: string;
  initialY: string;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

const Particle: React.FC<{ particle: ParticleProps }> = React.memo(({ particle }) => (
  <div
    className="absolute rounded-full animate-spore"
    style={{
      width: particle.size,
      height: particle.size,
      opacity: particle.opacity,
      backgroundColor: particle.color,
      filter: "blur(1px)",
      boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
      left: particle.initialX,
      top: particle.initialY,
      animationDuration: `${particle.duration}s`,
      animationDelay: `${particle.delay}s`,
    }}
  />
));

Particle.displayName = 'Particle';

export const FloatingParticles: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkIsDesktop = () => {
      setIsDesktop(window.matchMedia('(min-width: 768px)').matches);
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      key: i,
      size: Math.random() * 3 + 1,
      initialX: `${Math.random() * 100}%`,
      initialY: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.5 + 0.3,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * -30,
      color: `rgba(255, ${220 + Math.random() * 35}, ${220 + Math.random() * 35}, 0.8)`,
    }));
  }, []);

  if (!isClient || !isDesktop) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-radial from-red-900/5 via-transparent to-transparent pointer-events-none" />
      {particles.map((particle) => (
        <Particle key={particle.key} particle={particle} />
      ))}
    </div>
  );
};
