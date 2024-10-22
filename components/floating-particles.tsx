import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

export const FloatingParticles = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: 200 }, (_, i) => ({
      key: i,
      size: Math.random() * 3 + 1, // Decreased size range: 1-4px (previously 2-6px)
      initialTop: `${Math.random() * 100}vh`,
      initialLeft: `${Math.random() * 100}vw`,
      opacity: Math.random() * 0.4 + 0.2, // Increased opacity range: 0.2-0.6
      animateTop: [`${Math.random() * 100}vh`, `${Math.random() * 100}vh`],
      animateLeft: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`],
      duration: 30 + Math.random() * 20,
      delay: Math.random() * -30,
      // Add variation to particle colors
      color: Math.random() > 0.7 ? "rgba(255, 100, 100, 0.8)" : "rgba(255, 200, 200, 0.8)",
    }));
  }, []);

  if (!isClient) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Add a subtle ambient glow layer */}
      <div className="absolute inset-0 bg-gradient-radial from-red-900/5 via-transparent to-transparent pointer-events-none" />
      
      {particles.map((particle) => (
        <motion.div
          key={particle.key}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            backgroundColor: particle.color,
            filter: "blur(0.5px)", // Reduced blur for sharper edges (previously 1.5px)
            boxShadow: `
              0 0 ${particle.size * 1.5}px ${particle.color},
              0 0 ${particle.size * 3}px rgba(220, 38, 38, 0.3)
            `, // Adjusted glow effect to match smaller size
          }}
          initial={{
            top: particle.initialTop,
            left: particle.initialLeft,
            scale: 1,
          }}
          animate={{
            top: particle.animateTop,
            left: particle.animateLeft,
            scale: [1, 1.2, 1], // Subtle pulsing effect
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
            delay: particle.delay,
            scale: {
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            },
          }}
        />
      ))}
    </div>
  );
};
