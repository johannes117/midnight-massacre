'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { ArrowLeft, Skull, Key, Ghost, Heart, Brain, Footprints, Shield } from "lucide-react";
import { FloatingParticles } from "@/components/floating-particles";

export default function TutorialComponent() {
  const router = useRouter();
  
  const sections = [
    {
      icon: <Ghost className="w-8 h-8" />,
      title: "The Story",
      content: "You find yourself trapped in a haunted town on Halloween night, being hunted by an unstoppable masked killer known as 'The Stalker'. Your goal is to survive until dawn by making strategic choices, gathering vital items, and managing your survival score."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Survival Score",
      content: "Your survival score starts at 100 and represents your ability to stay alive. Successful actions increase it, while failures decrease it. If it reaches 0, it's game over. Keep an eye on your score and avoid high-risk actions when it's low."
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Choice Mechanics",
      content: "Each choice comes with:\n- Difficulty Check (DC): The target number you need to succeed\n- Risk Factor: How much survival score you might lose on failure\n- Reward Value: How much survival score you gain on success\n- Type: Combat, Stealth, Escape, or Search - each affected differently by your status and items"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Status Effects",
      content: "Your condition affects your chances:\n- Being injured makes actions harder\n- Hidden status helps with stealth\n- Being exposed increases difficulty\n- Environmental factors like darkness and noise impact your success chances"
    },
    {
      icon: <Key className="w-8 h-8" />,
      title: "Items & Victory",
      content: "Finding key items is crucial:\n- Weapons improve your combat chances and let you face The Stalker\n- Keys can unlock escape routes\n- You can win by either:\n  • Escaping with a key (75+ survival score)\n  • Confronting The Stalker with a weapon (100+ survival score)"
    },
    {
      icon: <Footprints className="w-8 h-8" />,
      title: "The Stalker",
      content: "The Stalker's presence increases throughout the game:\n- Distant: Low threat level\n- Hunting: Moderate threat\n- Closing In: High threat\n- Imminent: Extreme danger\nFailed actions and high tension can cause The Stalker to advance closer!"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-black to-purple-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl z-10"
      >
        <Card className="bg-black/70 border-orange-800 shadow-lg backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Skull className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-horror text-orange-500">How To Play</h1>
            </div>

            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-orange-950/30 p-4 rounded-lg border border-orange-800/50"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-orange-400">
                        {section.icon}
                      </div>
                      <h2 className="text-xl font-semibold text-orange-400">
                        {section.title}
                      </h2>
                    </div>
                    <p className="text-orange-200 whitespace-pre-line">
                      {section.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-6 flex justify-between items-center">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                className="text-orange-400 hover:text-orange-300 bg-black/30 hover:bg-black/50"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Menu
              </Button>
              
              <Button
                onClick={() => router.push('/game?start=true')}
                className="bg-orange-900/50 hover:bg-orange-800/70 text-orange-100"
              >
                Start Playing
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}