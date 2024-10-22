import { motion } from "framer-motion"
import { useEffect, useState, useMemo } from "react"

export const FloatingGhosts = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const ghosts = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      key: i,
      initialTop: `${Math.random() * 100}vh`,
      initialLeft: `${Math.random() * 100}vw`,
      scale: 0.5 + Math.random() * 0.5,
      animateTop: [`${Math.random() * 100}vh`, `${Math.random() * 100}vh`],
      animateLeft: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`],
      duration: 20 + Math.random() * 10,
    }))
  }, [])

  if (!isClient) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {ghosts.map((ghost) => (
        <motion.div 
          key={ghost.key} 
          className="absolute text-4xl opacity-10"
          initial={{ 
            top: ghost.initialTop, 
            left: ghost.initialLeft,
            scale: ghost.scale
          }}
          animate={{ 
            top: ghost.animateTop,
            left: ghost.animateLeft,
          }}
          transition={{ 
            duration: ghost.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
        >
          👻
        </motion.div>
      ))}
    </div>
  )
}
