import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function FloatingGhosts() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(10)].map((_, i) => (
        <motion.div 
          key={i} 
          className="absolute text-4xl opacity-10"
          initial={{ 
            top: `${Math.random() * 100}vh`, 
            left: `${Math.random() * 100}vw`,
            scale: 0.5 + Math.random() * 0.5
          }}
          animate={{ 
            top: [`${Math.random() * 100}vh`, `${Math.random() * 100}vh`],
            left: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`],
          }}
          transition={{ 
            duration: 20 + Math.random() * 10,
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
