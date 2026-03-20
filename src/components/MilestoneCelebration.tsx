import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, PartyPopper, X } from 'lucide-react';
import { useApp } from '../AppContext';

export const MilestoneCelebration: React.FC = () => {
  const { streak, state, dismissMilestone } = useApp();
  
  // Define milestones: 3, 7, 14, 30, 50, 100, etc.
  const milestones = [3, 7, 14, 30, 50, 100, 365];
  const currentMilestone = milestones.find(m => streak >= m && state.lastMilestoneSeen < m);

  if (!currentMilestone) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-aura-ink/40 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden text-center space-y-6"
        >
          {/* Background Decorations */}
          <div className="absolute top-0 left-0 w-full h-2 bg-aura-sage" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-aura-sage/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-aura-sage/5 rounded-full blur-2xl" />

          <div className="relative z-10 space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-aura-sage text-white rounded-[2rem] flex items-center justify-center shadow-lg">
                <Trophy size={40} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl serif italic">Amazing!</h2>
              <p className="text-aura-ink/60">
                You've reached a <span className="text-aura-sage font-bold">{currentMilestone} day streak</span> of mindful digital choices.
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    delay: i * 0.2
                  }}
                  className="text-aura-sage"
                >
                  <Star size={24} fill="currentColor" />
                </motion.div>
              ))}
            </div>

            <p className="text-sm italic text-aura-ink/40">
              "Consistency is the playground of excellence."
            </p>

            <button 
              onClick={dismissMilestone}
              className="w-full py-4 bg-aura-ink text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <PartyPopper size={20} /> Keep it up!
            </button>
          </div>

          <button 
            onClick={dismissMilestone}
            className="absolute top-6 right-6 text-aura-ink/20 hover:text-aura-ink/40 transition-colors"
          >
            <X size={20} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
